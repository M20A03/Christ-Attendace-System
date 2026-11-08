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
from sqlalchemy import Column, String, DateTime, LargeBinary, ForeignKey, select, delete, Integer, desc
from sqlalchemy.orm import selectinload

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


class Confession(Base):
    __tablename__ = "confessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content = Column(String(2000), nullable=False)
    campus = Column(String(64), default="Central Campus")
    category = Column(String(64), default="Campus Life")
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    comments = relationship("ConfessionComment", back_populates="confession", cascade="all, delete-orphan", order_by="ConfessionComment.created_at.asc()")


class ConfessionComment(Base):
    __tablename__ = "confession_comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    confession_id = Column(String(36), ForeignKey("confessions.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(String(1000), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    confession = relationship("Confession", back_populates="comments")


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


async def create_confession(content: str, campus: str = "Central Campus", category: str = "Campus Life") -> Confession:
    """Create an anonymous confession."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            confession = Confession(
                id=str(uuid.uuid4()),
                content=content.strip(),
                campus=campus.strip() if campus else "Central Campus",
                category=category.strip() if category else "Campus Life",
                likes_count=0,
                created_at=datetime.now(timezone.utc),
            )
            session.add(confession)
        # Re-fetch with eager loaded comments
        stmt = select(Confession).options(selectinload(Confession.comments)).where(Confession.id == confession.id)
        res = await session.execute(stmt)
        return res.scalar_one()


async def get_confessions(campus: Optional[str] = None, category: Optional[str] = None, sort_by: str = "newest", limit: int = 50):
    """Retrieve confessions with comments."""
    async with AsyncSessionLocal() as session:
        stmt = select(Confession).options(selectinload(Confession.comments))
        
        if campus and campus != "All Campuses":
            stmt = stmt.where(Confession.campus == campus)
        if category and category != "All":
            stmt = stmt.where(Confession.category == category)
            
        if sort_by == "popular":
            stmt = stmt.order_by(desc(Confession.likes_count), desc(Confession.created_at))
        else:
            stmt = stmt.order_by(desc(Confession.created_at))
            
        stmt = stmt.limit(limit)
        result = await session.execute(stmt)
        confessions = result.scalars().all()

        # Seed initial confessions if table is fresh
        if not confessions and not campus and not category:
            starter = [
                ("The filter coffee at Gourmet near Central Block hits differently before an 8:30 AM lecture.", "Central Campus", "Campus Life", 42),
                ("To whoever put 'I survived CIA 2' laptop sticker in Audi 1: need that energy for ESE.", "Central Campus", "Campus Life", 35),
                ("The evening breeze from Kengeri lake during campus breaks makes the Bangalore commute worth it.", "Kengeri", "Campus Life", 29),
                ("PSA: Submit your Yellow Form to the department coordinator within 3 days after fest or HOD will reject it!", "Central Campus", "Advice", 58),
                ("Library 4th floor quiet study cubicles are the only reason my GPA crossed 3.5 on 4.0 scale.", "Central Campus", "Campus Life", 44),
            ]
            for text, camp, cat, likes in starter:
                c = Confession(
                    id=str(uuid.uuid4()),
                    content=text,
                    campus=camp,
                    category=cat,
                    likes_count=likes,
                    created_at=datetime.now(timezone.utc),
                )
                session.add(c)
            await session.commit()
            result = await session.execute(stmt)
            confessions = result.scalars().all()

        return confessions


async def like_confession(confession_id: str) -> Optional[int]:
    """Increment like count on a confession."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            stmt = select(Confession).where(Confession.id == confession_id)
            res = await session.execute(stmt)
            confession = res.scalar_one_or_none()
            if confession:
                confession.likes_count += 1
                return confession.likes_count
    return None


async def add_confession_comment(confession_id: str, content: str) -> Optional[ConfessionComment]:
    """Add anonymous comment to a confession."""
    async with AsyncSessionLocal() as session:
        async with session.begin():
            stmt = select(Confession).where(Confession.id == confession_id)
            res = await session.execute(stmt)
            confession = res.scalar_one_or_none()
            if not confession:
                return None
            comment = ConfessionComment(
                id=str(uuid.uuid4()),
                confession_id=confession_id,
                content=content.strip(),
                created_at=datetime.now(timezone.utc),
            )
            session.add(comment)
            return comment

