from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import require_admin
from app.db.session import get_db
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.auth import UserResponse, UserRoleUpdate
from app.schemas.task import AdminTaskResponse, OwnerSummary

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/users", response_model=list[UserResponse])
async def list_users(db: Annotated[AsyncSession, Depends(get_db)]) -> list[User]:
    return list((await db.scalars(select(User).order_by(User.name, User.email))).all())


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    payload: UserRoleUpdate,
    admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")
    user.role = payload.role
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/tasks", response_model=list[AdminTaskResponse])
async def list_all_tasks(
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: UUID | None = None,
    status: TaskStatus | None = None,
    due_before: date | None = None,
    due_after: date | None = None,
) -> list[Task]:
    query = select(Task).options(selectinload(Task.category), selectinload(Task.owner))
    if user_id is not None:
        query = query.where(Task.owner_id == user_id)
    if status is not None:
        query = query.where(Task.status == status)
    if due_before is not None:
        query = query.where(Task.due_date <= due_before)
    if due_after is not None:
        query = query.where(Task.due_date >= due_after)
    return list((await db.scalars(query.order_by(Task.due_date, Task.created_at.desc()))).all())
