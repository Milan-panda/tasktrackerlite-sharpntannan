from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.task import TaskStatus
from app.schemas.category import CategoryResponse


class TaskWrite(BaseModel):
    category_id: UUID
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=5000)
    status: TaskStatus = TaskStatus.TODO
    due_date: date

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title is required")
        return value


class TaskStatusWrite(BaseModel):
    status: TaskStatus


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    category_id: UUID
    title: str
    description: str
    status: TaskStatus
    due_date: date
    created_at: datetime
    updated_at: datetime
    category: CategoryResponse


class OwnerSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str


class AdminTaskResponse(TaskResponse):
    owner: OwnerSummary
