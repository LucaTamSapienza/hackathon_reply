from datetime import date, datetime
from typing import Any, List, Optional

from pydantic import BaseModel


class MedicationIn(BaseModel):
    name: str
    dosage: str | None = None
    frequency: str | None = None
    notes: str | None = None


class PatientCreate(BaseModel):
    full_name: str
    date_of_birth: date | None = None
    allergies: str | None = None
    history: str | None = None
    medications: list[MedicationIn] | None = None


class PatientRead(BaseModel):
    id: int
    full_name: str
    date_of_birth: date | None = None
    allergies: str | None = None
    history: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConsultationCreate(BaseModel):
    patient_id: int | None = None
    patient: PatientCreate | None = None
    presenting_complaint: str | None = None


class ConsultationRead(BaseModel):
    id: int
    patient_id: int | None
    status: str
    summary: str | None
    created_at: datetime
    updated_at: datetime
    closed_at: datetime | None = None

    class Config:
        from_attributes = True


class TranscriptIn(BaseModel):
    speaker: str = "patient"
    text: str


class AgentOutputRead(BaseModel):
    agent: str
    category: str
    content: str
    confidence: float | None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    document_id: int
    filename: str
    kind: str | None
    patient_id: int
    uploaded_at: datetime


class InsightBundle(BaseModel):
    consultation_id: int
    transcript: str
    outputs: List[AgentOutputRead]


class MedicalRecordCreate(BaseModel):
    record_type: str
    title: str
    content_text: str | None = None
    data: dict[str, Any] | None = None
    source: str | None = None


class MedicalRecordRead(BaseModel):
    id: int
    patient_id: int
    record_type: str
    title: str
    content_text: str | None
    data: dict[str, Any] | None
    source: str | None
    created_at: datetime

    class Config:
        from_attributes = True
