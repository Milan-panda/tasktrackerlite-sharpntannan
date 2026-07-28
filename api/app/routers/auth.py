from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import CurrentUser
from app.core.security import sign_session_id, unsign_session_id
from app.db.session import get_db
from app.schemas.auth import LoginRequest, MessageResponse, RegisterRequest, UserResponse
from app.services.auth_service import (
    EmailAlreadyRegisteredError,
    authenticate_user,
    create_session,
    create_user,
    revoke_session,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    payload: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    try:
        user = await create_user(
            db,
            name=payload.name,
            email=str(payload.email),
            password=payload.password,
        )
    except EmailAlreadyRegisteredError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from error
    return UserResponse.model_validate(user)


@router.post("/login", response_model=UserResponse)
async def login(
    payload: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserResponse:
    user = await authenticate_user(db, email=str(payload.email), password=payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    session = await create_session(db, user)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=sign_session_id(session.id),
        max_age=settings.session_expire_minutes * 60,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        path="/",
    )
    return UserResponse.model_validate(user)


@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
    session_cookie: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> MessageResponse:
    session_id = unsign_session_id(session_cookie) if session_cookie else None
    if session_id is not None:
        await revoke_session(db, session_id)
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        secure=settings.secure_cookies,
        samesite="lax",
        path="/",
    )
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserResponse)
async def me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)
