from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.session import Session
from app.models.user import User, UserRole


class EmailAlreadyRegisteredError(Exception):
    pass


def normalize_email(email: str) -> str:
    return email.strip().lower()


async def create_user(db: AsyncSession, *, name: str, email: str, password: str) -> User:
    user = User(
        name=name.strip(),
        email=normalize_email(email),
        password_hash=hash_password(password),
        role=UserRole.USER,
    )
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as error:
        await db.rollback()
        raise EmailAlreadyRegisteredError from error
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, *, email: str, password: str) -> User | None:
    user = await db.scalar(
        select(User).where(func.lower(User.email) == normalize_email(email))
    )
    if user is None or not verify_password(password, user.password_hash):
        return None
    return user


async def create_session(db: AsyncSession, user: User) -> Session:
    session = Session(
        user_id=user.id,
        expires_at=datetime.now(timezone.utc)
        + timedelta(minutes=settings.session_expire_minutes),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def revoke_session(db: AsyncSession, session_id: UUID) -> None:
    await db.execute(
        update(Session)
        .where(Session.id == session_id, Session.revoked_at.is_(None))
        .values(revoked_at=datetime.now(timezone.utc))
    )
    await db.commit()
