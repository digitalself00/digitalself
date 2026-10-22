import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from src.BE.db.connect import get_db
from src.BE.db.models import User
from src.BE.enums.task_enums import FilterType
from src.BE.schemas.task_schema import (
    MomentumResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from src.BE.service.auth_service import get_current_user
from src.BE.service.task_service import TaskService

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("", response_model=List[TaskResponse])
def get_tasks(
    filter_type: FilterType = Query(FilterType.ALL, alias="filter"),
    search: Optional[str] = Query(None),
    date: Optional[datetime.date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve filtered list of tasks for authenticated user."""
    tasks = TaskService.list_tasks(
        db=db,
        user_id=current_user.id,
        filter_type=filter_type,
        search=search,
        target_date=date,
    )
    return [TaskResponse.model_validate(t) for t in tasks]


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new task."""
    task = TaskService.create_task(db=db, user_id=current_user.id, task_in=task_in)
    return TaskResponse.model_validate(task)


@router.get("/momentum", response_model=MomentumResponse)
def get_daily_momentum(
    date: Optional[datetime.date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Compute today's task momentum and completion rate."""
    return TaskService.get_momentum_stats(
        db=db,
        user_id=current_user.id,
        target_date=date,
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_single_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve single task by ID."""
    task = TaskService.get_task(db=db, user_id=current_user.id, task_id=task_id)
    return TaskResponse.model_validate(task)


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update task fields."""
    task = TaskService.update_task(
        db=db,
        user_id=current_user.id,
        task_id=task_id,
        task_in=task_in,
    )
    return TaskResponse.model_validate(task)


@router.patch("/{task_id}/toggle", response_model=TaskResponse)
def toggle_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle task status between pending and completed."""
    task = TaskService.toggle_task_status(db=db, user_id=current_user.id, task_id=task_id)
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a task."""
    TaskService.delete_task(db=db, user_id=current_user.id, task_id=task_id)
    return None
