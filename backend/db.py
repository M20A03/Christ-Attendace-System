"""
Database persistence layer using SQLAlchemy async engine.
Supports PostgreSQL (asyncpg) in production (Supabase/Railway) and SQLite (aiosqlite) for local dev.
"""
import os
import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy import Column, String, DateTime, LargeBinary, ForeignKey, select, delete

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    keycloak_sub = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    reg_number = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session = relationship("Session", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    refresh_token_encrypted = Column(LargeBinary, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="session")


class AttendanceCache(Base):
    __tablename__ = "attendance_cache"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    data_json = Column(String, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


def get_database_url() -> str:
    """
    Format DATABASE_URL to use async drivers.
    PostgreSQL -> postgresql+asyncpg://...
    SQLite fallback for local testing -> sqlite+aiosqlite:///...
    Automatically handles Neon/Supabase sslmode=require -> ssl=require for asyncpg.
    """
    url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./christ_attendance.db")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Handle sslmode parameter for asyncpg compatibility (Neon & Supabase)
    if "sslmode=require" in url:
        url = url.replace("sslmode=require", "ssl=require")
        
    return url


db_url = get_database_url()
engine = create_async_engine(
    db_url,
    echo=False,
    connect_args={"check_same_thread": False} if "sqlite" in db_url else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db():
    """Create tables if they do not exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """Dependency helper for FastAPI endpoints."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def upsert_user_and_session(
    keycloak_sub: str,
    name: str,
    reg_number: str,
    encrypted_refresh_token: bytes,
) -> User:
    """
    Insert or update student user record and update their encrypted refresh token.
    """
    async with AsyncSessionLocal() as session:
        async with session.begin():
            stmt = select(User).where(User.keycloak_sub == keycloak_sub)
            result = await session.execute(stmt)
            user = result.scalar_one_or_none()

            now = datetime.now(timezone.utc)
            if not user:
                user = User(
                    id=str(uuid.uuid4()),
                    keycloak_sub=keycloak_sub,
                    name=name,
                    reg_number=reg_number,
                    created_at=now,
                )
                session.add(user)
                await session.flush()
            else:
                user.name = name
                user.reg_number = reg_number

            # Upsert session
            stmt_session = select(Session).where(Session.user_id == user.id)
            sess_res = await session.execute(stmt_session)
            user_session = sess_res.scalar_one_or_none()

            if user_session:
                user_session.refresh_token_encrypted = encrypted_refresh_token
                user_session.updated_at = now
            else:
                user_session = Session(
                    user_id=user.id,
                    refresh_token_encrypted=encrypted_refresh_token,
                    updated_at=now,
                )
                session.add(user_session)

            return user


async def get_user_session(user_id: str) -> Optional[Tuple[User, bytes]]:
    """Retrieve user and encrypted refresh token."""
    async with AsyncSessionLocal() as session:
        stmt = select(User, Session.refresh_token_encrypted).join(
            Session, User.id == Session.user_id
        ).where(User.id == user_id)
        result = await session.execute(stmt)
        row = result.first()
        if row:
            return row[0], row[1]
        return None


async def get_user_session_by_sub(keycloak_sub: str) -> Optional[Tuple[User, bytes]]:
    """Retrieve user and encrypted refresh token by Keycloak subject id."""
    async with AsyncSessionLocal() as session:
        stmt = select(User, Session.refresh_token_encrypted).join(
            Session, User.id == Session.user_id
        ).where(User.keycloak_sub == keycloak_sub)
        result = await session.execute(stmt)
        row = result.first()
        if row:
            return row[0], row[1]
        return None


async def update_user_refresh_token(user_id: str, new_encrypted_token: bytes):
    """Update rotated refresh token for user."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            stmt = select(Session).where(Session.user_id == user_id)
            result = await session.execute(stmt)
            user_session = result.scalar_one_or_none()
            if user_session:
                user_session.refresh_token_encrypted = new_encrypted_token
                user_session.updated_at = datetime.now(timezone.utc)


async def delete_user_session(user_id: str):
    """Delete session upon logout."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            stmt = delete(Session).where(Session.user_id == user_id)
            await session.execute(stmt)


async def save_cached_attendance(user_id: str, data_json: str):
    """Save real attendance records in database for 30+ days persistence."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            stmt = select(AttendanceCache).where(AttendanceCache.user_id == user_id)
            result = await session.execute(stmt)
            cache = result.scalar_one_or_none()
            now = datetime.now(timezone.utc)
            if cache:
                cache.data_json = data_json
                cache.updated_at = now
            else:
                cache = AttendanceCache(user_id=user_id, data_json=data_json, updated_at=now)
                session.add(cache)


async def get_cached_attendance(user_id: str) -> Optional[str]:
    """Retrieve persistent real attendance records for user."""
    async with AsyncSessionLocal() as session:
        stmt = select(AttendanceCache.data_json).where(AttendanceCache.user_id == user_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

