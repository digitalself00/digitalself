from enum import Enum


class TaskPriority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class TaskStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"


class FilterType(str, Enum):
    ALL = "all"
    HIGH = "high"
    TODAY = "today"
    COMPLETED = "completed"
