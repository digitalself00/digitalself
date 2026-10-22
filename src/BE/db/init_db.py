import datetime
from sqlalchemy.orm import Session
from src.BE.db.connect import Base, SessionLocal, engine
from src.BE.db.models import Task, User
from src.BE.enums.task_enums import TaskPriority, TaskStatus
from src.BE.utils.security import get_password_hash


def init_db():
    """Initializes schema and seeds demo data."""
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if demo user exists
        demo_email = "alex@example.com"
        user = db.query(User).filter(User.email == demo_email).first()

        if not user:
            user = User(
                full_name="Alex Morgan",
                email=demo_email,
                hashed_password=get_password_hash("password123"),
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Check if tasks exist for this user
        existing_tasks_count = db.query(Task).filter(Task.user_id == user.id).count()

        if existing_tasks_count == 0:
            today = datetime.date.today()
            sample_tasks = [
                Task(
                    user_id=user.id,
                    title="Quarterly Strategic Review",
                    description="Align executive stakeholders on Q4 deliverables, product roadmap milestones, and OKR completion metrics.",
                    task_date=today,
                    start_time="09:00 AM",
                    end_time="10:30 AM",
                    priority=TaskPriority.HIGH.value,
                    status=TaskStatus.PENDING.value,
                    reminder_minutes=10,
                    location_or_tag="Executive Boardroom",
                ),
                Task(
                    user_id=user.id,
                    title="Client Sync & Feedback",
                    description="Review live prototype interactions with Acme Corp leadership and document critical workflow feedback.",
                    task_date=today,
                    start_time="11:15 AM",
                    end_time="12:00 PM",
                    priority=TaskPriority.HIGH.value,
                    status=TaskStatus.PENDING.value,
                    reminder_minutes=15,
                    location_or_tag="Virtual Call",
                ),
                Task(
                    user_id=user.id,
                    title="Update Design Guidelines",
                    description="Incorporate new typography scale, micro-interaction motion curves, and accessibility contrast standards.",
                    task_date=today,
                    start_time="02:00 PM",
                    end_time="03:30 PM",
                    priority=TaskPriority.MEDIUM.value,
                    status=TaskStatus.PENDING.value,
                    reminder_minutes=10,
                    location_or_tag="Design System",
                ),
                Task(
                    user_id=user.id,
                    title="Refactor Team Docs & Templates",
                    description="Prune deprecated sprint templates and archive past retrospective boards in Notion.",
                    task_date=today,
                    start_time="04:45 PM",
                    end_time="05:15 PM",
                    priority=TaskPriority.LOW.value,
                    status=TaskStatus.PENDING.value,
                    reminder_minutes=5,
                    location_or_tag="Engineering Docs",
                ),
                Task(
                    user_id=user.id,
                    title="Weekly Standup Alignment",
                    description="Synchronized front-end status with core engineering, finalized asset handoff timeline.",
                    task_date=today,
                    start_time="08:30 AM",
                    end_time="09:00 AM",
                    priority=TaskPriority.MEDIUM.value,
                    status=TaskStatus.COMPLETED.value,
                    reminder_minutes=10,
                    completed_at=datetime.datetime.now(datetime.timezone.utc),
                    location_or_tag="Team Standup",
                ),
            ]

            db.add_all(sample_tasks)
            db.commit()
            print(f"[init_db] Successfully seeded {len(sample_tasks)} demo tasks for {demo_email}")
        else:
            print("[init_db] Database already contains seed tasks.")

    except Exception as e:
        db.rollback()
        print(f"[init_db] Warning during DB initialization: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
