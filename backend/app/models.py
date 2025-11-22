from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class Patient(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    full_name: str
    date_of_birth: Optional[date] = None
    allergies: Optional[str] = None
    history: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Medication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    filename: str
    file_path: str
    content_type: Optional[str] = None
    kind: Optional[str] = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)


class MedicalRecord(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: int = Field(foreign_key="patient.id")
    record_type: str = Field(description="lab_panel | imaging | exam | note | other")
    title: str
    content_text: Optional[str] = Field(default=None, description="Narrative text or summary")
    data: Optional[dict[str, Any]] = Field(
        default=None,
        sa_column=Column(JSON),
        description="Structured payload, e.g., lab values",
    )
    source: Optional[str] = Field(default=None, description="where it came from (pdf upload, manual, EHR)")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Consultation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    patient_id: Optional[int] = Field(default=None, foreign_key="patient.id")
    status: str = Field(default="active")
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    closed_at: Optional[datetime] = None


class TranscriptChunk(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    consultation_id: int = Field(foreign_key="consultation.id")
    speaker: str = Field(default="patient")
    text: str
    captured_at: datetime = Field(default_factory=datetime.utcnow)


class AgentOutput(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    consultation_id: int = Field(foreign_key="consultation.id")
    agent: str
    category: str = Field(default="insight")  # insight | alert | note | diagnosis
    content: str
    confidence: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
