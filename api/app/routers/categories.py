from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, require_admin
from app.db.session import get_db
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryResponse, CategoryWrite

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(_: CurrentUser, db: Annotated[AsyncSession, Depends(get_db)]) -> list[Category]:
    return list((await db.scalars(select(Category).where(Category.is_active.is_(True)).order_by(Category.name))).all())


async def save_category(db: AsyncSession, category: Category) -> Category:
    try:
        await db.commit()
    except IntegrityError as error:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A category with this name already exists") from error
    await db.refresh(category)
    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryWrite,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Category:
    category = Category(name=payload.name)
    db.add(category)
    return await save_category(db, category)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    payload: CategoryWrite,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Category:
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    category.name = payload.name
    return await save_category(db, category)


@router.delete("/{category_id}", response_model=CategoryResponse)
async def deactivate_category(
    category_id: UUID,
    _: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Category:
    category = await db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    category.is_active = False
    await db.commit()
    await db.refresh(category)
    return category
