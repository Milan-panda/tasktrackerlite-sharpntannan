from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser
from app.db.session import get_db
from app.models.category import Category
from app.models.task import Task, TaskStatus
from app.schemas.task import TaskResponse, TaskStatusWrite, TaskWrite

router = APIRouter(prefix="/tasks", tags=["tasks"])


async def active_category(db: AsyncSession, category_id: UUID) -> Category:
    category = await db.scalar(select(Category).where(Category.id == category_id, Category.is_active.is_(True)))
    if category is None:
        raise HTTPException(status_code=400, detail="Category must be active")
    return category


async def owned_task(db: AsyncSession, task_id: UUID, owner_id: UUID) -> Task:
    task = await db.scalar(
        select(Task).options(selectinload(Task.category)).where(Task.id == task_id, Task.owner_id == owner_id)
    )
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def validate_status_date(task_status: TaskStatus, due_date: date) -> None:
    if due_date < date.today() and task_status != TaskStatus.TODO:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Status cannot change after the due date")


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(payload: TaskWrite, user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]) -> Task:
    category = await active_category(db, payload.category_id)
    validate_status_date(payload.status, payload.due_date)
    task = Task(owner_id=user.id, category_id=category.id, **payload.model_dump(exclude={"category_id"}))
    task.category = category
    db.add(task)
    await db.commit()
    return await owned_task(db, task.id, user.id)


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    task_status: Annotated[TaskStatus | None, Query(alias="status")] = None,
    category_id: UUID | None = None,
) -> list[Task]:
    query = select(Task).options(selectinload(Task.category)).where(Task.owner_id == user.id)
    if task_status is not None:
        query = query.where(Task.status == task_status)
    if category_id is not None:
        query = query.where(Task.category_id == category_id)
    return list((await db.scalars(query.order_by(Task.due_date, Task.created_at.desc()))).all())


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID, payload: TaskWrite, user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]
) -> Task:
    task = await owned_task(db, task_id, user.id)
    if payload.category_id != task.category_id:
        task.category = await active_category(db, payload.category_id)
    # A PUT that changes status is a status change; editing other fields on an overdue task remains allowed.
    if payload.status != task.status:
        validate_status_date(payload.status, payload.due_date)
    for field, value in payload.model_dump(exclude={"category_id"}).items():
        setattr(task, field, value)
    task.category_id = payload.category_id
    await db.commit()
    return await owned_task(db, task.id, user.id)


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def change_status(
    task_id: UUID, payload: TaskStatusWrite, user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]
) -> Task:
    task = await owned_task(db, task_id, user.id)
    if payload.status != task.status:
        validate_status_date(payload.status, task.due_date)
        task.status = payload.status
        await db.commit()
    return await owned_task(db, task.id, user.id)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: UUID, user: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]) -> None:
    task = await owned_task(db, task_id, user.id)
    await db.delete(task)
    await db.commit()
