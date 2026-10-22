import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from src.BE.constant.config import settings

Base = declarative_base()

def get_engine_and_session():
    database_url = settings.DATABASE_URL
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+psycopg2://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+psycopg2://", 1)

    is_postgres = database_url.startswith("postgresql")

    if is_postgres:
        try:
            # Test PostgreSQL connection with short timeout
            test_engine = create_engine(
                database_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={"connect_timeout": 3},
            )
            with test_engine.connect() as conn:
                pass
            print(f"[DigitalSelf DB] Connected to PostgreSQL at {settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}")
            return test_engine, sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
        except Exception as e:
            fallback = os.getenv("USE_SQLITE_FALLBACK", "True").lower() in ("true", "1", "yes")
            if fallback:
                sqlite_url = "sqlite:///./digitalself.db"
                print(f"\n[DigitalSelf DB Warning] Could not connect to PostgreSQL ({e}).")
                print(f"[DigitalSelf DB Notice] Falling back to local SQLite ({sqlite_url}) for development.")
                print(f"[DigitalSelf DB Tip] Once your PostgreSQL server is running, update .env and restart to use PostgreSQL.\n")
                fallback_engine = create_engine(
                    sqlite_url,
                    connect_args={"check_same_thread": False},
                )
                return fallback_engine, sessionmaker(autocommit=False, autoflush=False, bind=fallback_engine)
            else:
                raise

    # Default SQLite
    engine = create_engine(database_url, connect_args={"check_same_thread": False})
    return engine, sessionmaker(autocommit=False, autoflush=False, bind=engine)


engine, SessionLocal = get_engine_and_session()


def get_db():
    """FastAPI dependency for database session lifecycle."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
