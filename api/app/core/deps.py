from datetime import datetime, timezone
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import unsign_session_id
from app.db.session import get_db
from app.models.session import Session
from app.models.user import User, UserRole


async def get_current_session(
    db: Annotated[AsyncSession, Depends(get_db)],
    session_cookie: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> Session:
    session_id = unsign_session_id(session_cookie) if session_cookie else None
    if session_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    session = await db.scalar(select(Session).where(Session.id == session_id))
    now = datetime.now(timezone.utc)
    if session is None or session.revoked_at is not None or session.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session is invalid or expired")
    return session


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    session: Annotated[Session, Depends(get_current_session)],
) -> User:
    user = await db.get(User, session.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User no longer exists")
    return user


async def require_admin(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
