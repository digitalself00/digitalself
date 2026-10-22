import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from src.BE.db.models import Task
from src.BE.enums.task_enums import FilterType, TaskPriority, TaskStatus
from src.BE.exceptions.custom_exceptions import NotFoundException
from src.BE.schemas.task_schema import MomentumResponse, TaskCreate, TaskUpdate


class TaskService:
    @staticmethod
    def list_tasks(
        db: Session,
        user_id: str,
        filter_type: FilterType = FilterType.ALL,
        search: Optional[str] = None,
        target_date: Optional[datetime.date] = None,
    ) -> List[Task]:
        today = target_date or datetime.date.today()
        query = db.query(Task).filter(Task.user_id == user_id)

        # Search query filter
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Task.title.ilike(term),
                    Task.description.ilike(term),
                    Task.location_or_tag.ilike(term),
                )
            )

        # Category/Status Filter
        if filter_type == FilterType.HIGH:
            query = query.filter(Task.priority == TaskPriority.HIGH.value)
        elif filter_type == FilterType.TODAY:
            query = query.filter(Task.task_date == today)
        elif filter_type == FilterType.COMPLETED:
            query = query.filter(Task.status == TaskStatus.COMPLETED.value)

        # Ordering: Pending tasks first, then by priority (High first), then by start_time
        return query.order_by(
            Task.status.asc(),
            Task.task_date.asc(),
            Task.created_at.desc(),
        ).all()

    @staticmethod
    def create_task(db: Session, user_id: str, task_in: TaskCreate) -> Task:
        task = Task(
            user_id=user_id,
            title=task_in.title.strip(),
            description=task_in.description.strip() if task_in.description else None,
            task_date=task_in.task_date or datetime.date.today(),
            start_time=task_in.start_time,
            end_time=task_in.end_time,
            priority=task_in.priority.value,
            status=TaskStatus.PENDING.value,
            reminder_minutes=task_in.reminder_minutes,
            location_or_tag=task_in.location_or_tag,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_task(db: Session, user_id: str, task_id: str) -> Task:
        task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
        if not task:
            raise NotFoundException(detail="Task not found")
        return task

    @staticmethod
    def update_task(db: Session, user_id: str, task_id: str, task_in: TaskUpdate) -> Task:
        task = TaskService.get_task(db, user_id, task_id)
        update_data = task_in.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            if key == "priority" and value is not None:
                setattr(task, key, value.value if hasattr(value, "value") else value)
            elif key == "status" and value is not None:
                new_status = value.value if hasattr(value, "value") else value
                setattr(task, key, new_status)
                if new_status == TaskStatus.COMPLETED.value:
                    task.completed_at = datetime.datetime.now(datetime.timezone.utc)
                else:
                    task.completed_at = None
            elif value is not None:
                setattr(task, key, value)

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def toggle_task_status(db: Session, user_id: str, task_id: str) -> Task:
        task = TaskService.get_task(db, user_id, task_id)
        if task.status == TaskStatus.COMPLETED.value:
            task.status = TaskStatus.PENDING.value
            task.completed_at = None
        else:
            task.status = TaskStatus.COMPLETED.value
            task.completed_at = datetime.datetime.now(datetime.timezone.utc)

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete_task(db: Session, user_id: str, task_id: str) -> None:
        task = TaskService.get_task(db, user_id, task_id)
        db.delete(task)
        db.commit()

    @staticmethod
    def get_momentum_stats(
        db: Session,
        user_id: str,
        target_date: Optional[datetime.date] = None,
    ) -> MomentumResponse:
        today = target_date or datetime.date.today()
        today_tasks = db.query(Task).filter(Task.user_id == user_id, Task.task_date == today).all()

        total = len(today_tasks)
        completed = sum(1 for t in today_tasks if t.status == TaskStatus.COMPLETED.value)
        rate = round((completed / total) * 100) if total > 0 else 0
        remaining = total - completed

        if total == 0:
            status_label = "All Clear"
        elif rate >= 70:
            status_label = "On Track"
        elif rate >= 40:
            status_label = "In Progress"
        else:
            status_label = "Focus Time"

        return MomentumResponse(
            total_today=total,
            completed_today=completed,
            completion_rate=rate,
            remaining_count=remaining,
            status_label=status_label,
        )
