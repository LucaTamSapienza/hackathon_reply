from datetime import datetime
from typing import Iterable, List, Optional

from fastapi import HTTPException, status
from sqlmodel import Session, select

from ..agents.orchestrator import AgentResult, Orchestrator
from ..config import Settings
from ..models import (
    AgentOutput,
    Consultation,
    Document,
    Medication,
    MedicalRecord,
    Patient,
    TranscriptChunk,
)
from ..schemas import ConsultationCreate, PatientCreate, TranscriptIn


def create_patient_record(session: Session, payload: PatientCreate) -> Patient:
    patient = Patient(
        full_name=payload.full_name,
        date_of_birth=payload.date_of_birth,
        allergies=payload.allergies,
        history=payload.history,
    )
    session.add(patient)
    session.commit()
    session.refresh(patient)

    for med in payload.medications or []:
        medication = Medication(
            patient_id=patient.id,
            name=med.name,
            dosage=med.dosage,
            frequency=med.frequency,
            notes=med.notes,
        )
        session.add(medication)
    session.commit()
    return patient


def create_consultation(session: Session, payload: ConsultationCreate) -> Consultation:
    patient_id = payload.patient_id
    if patient_id is None:
        if payload.patient is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide patient_id or patient payload",
            )
        patient = create_patient_record(session, payload.patient)
        patient_id = patient.id
    else:
        patient = session.get(Patient, patient_id)
        if patient is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    consultation = Consultation(
        patient_id=patient_id,
        status="active",
        summary=payload.presenting_complaint,
    )
    session.add(consultation)
    session.commit()
    session.refresh(consultation)
    return consultation


def get_consultation(session: Session, consultation_id: int) -> Consultation:
    consultation = session.get(Consultation, consultation_id)
    if not consultation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consultation not found")
    return consultation


def _patient_context(session: Session, consultation: Consultation) -> dict:
    patient = session.get(Patient, consultation.patient_id) if consultation.patient_id else None
    medications = session.exec(
        select(Medication).where(Medication.patient_id == consultation.patient_id)
    ).all()
    documents = session.exec(select(Document).where(Document.patient_id == consultation.patient_id)).all()
    records = (
        session.exec(
            select(MedicalRecord)
            .where(MedicalRecord.patient_id == consultation.patient_id)
            .order_by(MedicalRecord.created_at.desc())
            .limit(5)
        ).all()
        if consultation.patient_id
        else []
    )

    def _record_snippet(rec: MedicalRecord) -> str:
        data_preview = ""
        if rec.data:
            # Show up to 3 key-value pairs
            items = list(rec.data.items())[:3]
            data_preview = "; ".join(f"{k}: {v}" for k, v in items)
        text_preview = ""
        if rec.content_text:
            text_preview = rec.content_text[:120]
        parts = [f"{rec.record_type}: {rec.title}"]
        if data_preview:
            parts.append(data_preview)
        if text_preview:
            parts.append(text_preview)
        return " | ".join(parts)

    records_summary = "; ".join(_record_snippet(r) for r in records) if records else None
    complaint = consultation.summary
    if complaint and complaint.startswith("[Scribe] Offline summary"):
        complaint = None

    return {
        "allergies": patient.allergies if patient else None,
        "history": patient.history if patient else None,
        "medications": ", ".join(f"{m.name} ({m.dosage or ''})".strip() for m in medications) if medications else None,
        "documents": ", ".join(doc.filename for doc in documents) if documents else None,
        "records": records_summary,
        "complaint": complaint,
    }


def _full_transcript(session: Session, consultation_id: int) -> str:
    chunks = session.exec(
        select(TranscriptChunk)
        .where(TranscriptChunk.consultation_id == consultation_id)
        .order_by(TranscriptChunk.captured_at, TranscriptChunk.id)
    ).all()
    return "\n".join(f"[{chunk.speaker}] {chunk.text}" for chunk in chunks)


def append_transcript_and_run_agents(
    session: Session,
    consultation_id: int,
    transcript: TranscriptIn,
    orchestrator: Orchestrator,
) -> List[AgentOutput]:
    consultation = get_consultation(session, consultation_id)
    if consultation.status == "closed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Consultation already closed")

    chunk = TranscriptChunk(
        consultation_id=consultation_id,
        speaker=transcript.speaker,
        text=transcript.text,
    )
    session.add(chunk)
    consultation.updated_at = datetime.utcnow()
    session.commit()

    context = _patient_context(session, consultation)
    full_transcript = _full_transcript(session, consultation_id)
    agent_results: Iterable[AgentResult] = orchestrator.run(full_transcript, context)

    outputs: List[AgentOutput] = []
    for result in agent_results:
        output = AgentOutput(
            consultation_id=consultation_id,
            agent=result.agent,
            category=result.category,
            content=result.content,
            confidence=result.confidence,
        )
        outputs.append(output)
        session.add(output)
        if result.category == "note" and not result.content.startswith("[Scribe] Offline summary"):
            consultation.summary = result.content

    session.commit()
    for output in outputs:
        session.refresh(output)
    session.refresh(consultation)
    return outputs


def list_agent_outputs(session: Session, consultation_id: int) -> List[AgentOutput]:
    return session.exec(
        select(AgentOutput)
        .where(AgentOutput.consultation_id == consultation_id)
        .order_by(AgentOutput.created_at.desc())
    ).all()


def close_consultation(session: Session, consultation_id: int, summary: Optional[str] = None) -> Consultation:
    consultation = get_consultation(session, consultation_id)
    consultation.status = "closed"
    consultation.closed_at = datetime.utcnow()
    consultation.summary = summary or consultation.summary
    session.add(consultation)
    session.commit()
    session.refresh(consultation)
    return consultation
