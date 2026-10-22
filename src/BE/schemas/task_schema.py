import datetime
from typing import Optional
from pydantic import BaseModel, Field
from src.BE.enums.task_enums import TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    task_date: Optional[datetime.date] = None
    start_time: Optional[str] = "09:00 AM"
    end_time: Optional[str] = "10:30 AM"
    priority: TaskPriority = TaskPriority.MEDIUM
    reminder_minutes: Optional[int] = 10
    location_or_tag: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    task_date: Optional[datetime.date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    reminder_minutes: Optional[int] = None
    location_or_tag: Optional[str] = None


class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str] = None
    task_date: datetime.date
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    priority: str
    status: str
    reminder_minutes: Optional[int] = None
    location_or_tag: Optional[str] = None
    completed_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True


class MomentumResponse(BaseModel):
    total_today: int
    completed_today: int
    completion_rate: int
    remaining_count: int
    status_label: str
