"""
Database persistence layer using SQLAlchemy async engine.
Supports PostgreSQL (asyncpg) in production (Supabase/Railway) and SQLite (aiosqlite) for local dev.
"""
import os
import uuid
from datetime import datetime, timezone, timedelta
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
    content = Column(String(80), nullable=False)
    campus = Column(String(64), default="Central Campus")
    category = Column(String(64), default="Campus Life")
    likes_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    comments = relationship("ConfessionComment", back_populates="confession", cascade="all, delete-orphan", order_by="ConfessionComment.created_at.asc()")


class ConfessionComment(Base):
    __tablename__ = "confession_comments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    confession_id = Column(String(36), ForeignKey("confessions.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    confession = relationship("Confession", back_populates="comments")


class ConfessionAuthorCooldown(Base):
    __tablename__ = "confession_cooldowns"

    author_id = Column(String(64), primary_key=True)
    last_posted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


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


async def create_confession(
    content: str,
    campus: str = "Central Campus",
    category: str = "Campus Life",
    author_id: Optional[str] = None
) -> Confession:
    """
    Create an anonymous confession.
    Enforces maximum 80 characters and 1 confession per 3 days (72 hours) per author.
    """
    clean_text = content.strip()
    if len(clean_text) > 80:
        raise ValueError("Confession must be 80 characters or fewer")

    now = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Enforce 3-day cooldown (1 confession per 3 days)
            if author_id:
                stmt = select(ConfessionAuthorCooldown).where(ConfessionAuthorCooldown.author_id == author_id)
                res = await session.execute(stmt)
                cd = res.scalar_one_or_none()
                if cd and cd.last_posted_at:
                    elapsed = now - cd.last_posted_at
                    if elapsed < timedelta(days=3):
                        remaining = timedelta(days=3) - elapsed
                        rem_hours = max(1, int(remaining.total_seconds() // 3600))
                        rem_days = rem_hours // 24
                        time_str = f"{rem_days}d {rem_hours % 24}h" if rem_days > 0 else f"{rem_hours}h"
                        raise ValueError(f"You can post only 1 confession every 3 days. Next available in {time_str}.")
                    cd.last_posted_at = now
                else:
                    new_cd = ConfessionAuthorCooldown(author_id=author_id, last_posted_at=now)
                    session.add(new_cd)

            confession = Confession(
                id=str(uuid.uuid4()),
                content=clean_text,
                campus=campus.strip() if campus else "Central Campus",
                category=category.strip() if category else "Campus Life",
                likes_count=0,
                created_at=now,
            )
            session.add(confession)

        # Re-fetch with eager loaded comments
        stmt = select(Confession).options(selectinload(Confession.comments)).where(Confession.id == confession.id)
        res = await session.execute(stmt)
        return res.scalar_one()


async def get_confessions(campus: Optional[str] = None, category: Optional[str] = None, sort_by: str = "newest", limit: int = 50):
    """
    Retrieve active confessions with comments.
    Confessions automatically reset every 24 hours (records older than 24h are deleted).
    """
    now = datetime.now(timezone.utc)
    cutoff_24h = now - timedelta(hours=24)

    async with AsyncSessionLocal() as session:
        # Automatic 24-hour cleanup: remove expired confessions
        try:
            await session.execute(delete(Confession).where(Confession.created_at < cutoff_24h))
            await session.commit()
        except Exception:
            pass

        stmt = select(Confession).options(selectinload(Confession.comments)).where(Confession.created_at >= cutoff_24h)
        
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

