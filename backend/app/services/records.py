from fastapi import HTTPException, status
from sqlmodel import Session, select

from ..models import MedicalRecord, Patient
from ..schemas import MedicalRecordCreate


def create_record(session: Session, patient_id: int, payload: MedicalRecordCreate) -> MedicalRecord:
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    record = MedicalRecord(
        patient_id=patient_id,
        record_type=payload.record_type,
        title=payload.title,
        content_text=payload.content_text,
        data=payload.data,
        source=payload.source,
    )
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


def list_records(session: Session, patient_id: int) -> list[MedicalRecord]:
    return session.exec(
        select(MedicalRecord)
        .where(MedicalRecord.patient_id == patient_id)
        .order_by(MedicalRecord.created_at.desc())
    ).all()
