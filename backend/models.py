"""
Архитектура базы данных SQLite / PostgreSQL (SQLAlchemy + Pydantic v2)
для веб-приложения репетитора «Квант & Код».
"""
from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    ForeignKey,
    DateTime,
    Enum as SQLEnum,
    Float,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class RoleEnum(str, Enum):
    tutor = "tutor"
    student = "student"

class SubjectEnum(str, Enum):
    math = "math"
    physics = "physics"
    cs = "cs"

class SlotStatusEnum(str, Enum):
    available = "available"
    booked = "booked"
    completed = "completed"
    cancelled = "cancelled"

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    role = Column(SQLEnum(RoleEnum), default=RoleEnum.student, nullable=False)
    avatar_url = Column(String(255), nullable=True)
    grade = Column(String(50), nullable=True) # e.g. "11 класс"
    target_exam = Column(String(50), nullable=True) # e.g. "ЕГЭ Профиль"
    target_score = Column(Integer, default=90)
    current_score = Column(Integer, default=70)
    parent_name = Column(String(100), nullable=True)
    parent_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    booked_slots = relationship("TimeSlotDB", back_populates="student")
    homeworks = relationship("HomeworkDB", back_populates="student")
    informal_notes = relationship("InformalNoteDB", back_populates="student")

class TimeSlotDB(Base):
    __tablename__ = "time_slots"

    id = Column(String(50), primary_key=True, index=True)
    date = Column(String(20), nullable=False, index=True) # YYYY-MM-DD
    start_time = Column(String(10), nullable=False) # HH:mm
    end_time = Column(String(10), nullable=False)
    subject = Column(SQLEnum(SubjectEnum), nullable=False)
    tutor_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    is_booked = Column(Boolean, default=False)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    student_name = Column(String(100), nullable=True)
    topic = Column(String(255), nullable=True)
    meeting_link = Column(String(255), nullable=True)
    status = Column(SQLEnum(SlotStatusEnum), default=SlotStatusEnum.available)

    student = relationship("UserDB", back_populates="booked_slots", foreign_keys=[student_id])

class TaskDB(Base):
    __tablename__ = "tasks"

    id = Column(String(50), primary_key=True, index=True)
    subject = Column(SQLEnum(SubjectEnum), nullable=False, index=True)
    topic = Column(String(150), nullable=False, index=True)
    exam_number = Column(String(50), nullable=True) # e.g. "ЕГЭ №18"
    difficulty = Column(String(20), default="medium")
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    formula = Column(Text, nullable=True)
    hints_json = Column(Text, nullable=False, default="[]") # JSON list
    correct_answer = Column(String(255), nullable=False)
    full_solution = Column(Text, nullable=False)
    starter_code = Column(Text, nullable=True)
    language = Column(String(20), default="python")
    test_cases_json = Column(Text, nullable=True, default="[]") # JSON test cases
    created_at = Column(DateTime, default=datetime.utcnow)

class HomeworkDB(Base):
    __tablename__ = "homeworks"

    id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    subject = Column(SQLEnum(SubjectEnum), nullable=False)
    title = Column(String(255), nullable=False)
    assigned_date = Column(String(20), nullable=False)
    due_date = Column(String(20), nullable=False)
    status = Column(String(30), default="assigned")
    tasks_json = Column(Text, nullable=False, default="[]") # Tasks answers & code
    tutor_feedback = Column(Text, nullable=True)
    grade = Column(Float, nullable=True)

    student = relationship("UserDB", back_populates="homeworks")

class InformalNoteDB(Base):
    __tablename__ = "informal_notes"

    id = Column(String(50), primary_key=True, index=True)
    student_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String(20), nullable=False)
    subject = Column(SQLEnum(SubjectEnum), nullable=False)
    topic_covered = Column(String(255), nullable=False)
    emotional_state = Column(Text, nullable=False)
    weak_spots = Column(Text, nullable=False)
    topics_to_review_json = Column(Text, default="[]")
    homework_performance = Column(String(30), default="good")
    action_items_next_lesson = Column(Text, nullable=False)
    internal_score = Column(Integer, default=8)

    student = relationship("UserDB", back_populates="informal_notes")
