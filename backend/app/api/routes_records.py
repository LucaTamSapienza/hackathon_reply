from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..db import get_session
from ..schemas import MedicalRecordCreate, MedicalRecordRead
from ..services import records

router = APIRouter(prefix="/records", tags=["records"])


@router.post("/patients/{patient_id}", response_model=MedicalRecordRead)
def create_medical_record(
    patient_id: int,
    payload: MedicalRecordCreate,
    session: Session = Depends(get_session),
):
    record = records.create_record(session, patient_id, payload)
    return MedicalRecordRead.model_validate(record)


@router.get("/patients/{patient_id}", response_model=list[MedicalRecordRead])
def list_medical_records(
    patient_id: int,
    session: Session = Depends(get_session),
):
    items = records.list_records(session, patient_id)
    return [MedicalRecordRead.model_validate(i) for i in items]
