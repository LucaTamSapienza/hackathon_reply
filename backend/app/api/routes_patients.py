from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..db import get_session
from ..models import Patient
from ..schemas import PatientCreate, PatientRead
from ..services.consultation import create_patient_record

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("", response_model=PatientRead)
def create_patient(payload: PatientCreate, session: Session = Depends(get_session)):
    patient = create_patient_record(session, payload)
    return patient


@router.get("", response_model=list[PatientRead])
def list_patients(session: Session = Depends(get_session)):
    patients = session.exec(select(Patient).order_by(Patient.created_at.desc())).all()
    return patients
