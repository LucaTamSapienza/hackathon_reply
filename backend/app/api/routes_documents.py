from typing import Optional

from fastapi import APIRouter, Depends, File, UploadFile
from sqlmodel import Session, select

from ..config import get_settings
from ..db import get_session
from ..models import Document
from ..schemas import DocumentUploadResponse
from ..services.documents import save_document

router = APIRouter(prefix="/documents", tags=["documents"])
settings = get_settings()


@router.post("/patients/{patient_id}", response_model=DocumentUploadResponse)
async def upload_patient_document(
    patient_id: int,
    file: UploadFile = File(...),
    kind: Optional[str] = None,
    session: Session = Depends(get_session),
):
    document = save_document(session, file, patient_id, settings, kind=kind)
    return DocumentUploadResponse(
        document_id=document.id,
        filename=document.filename,
        kind=document.kind,
        patient_id=document.patient_id,
        uploaded_at=document.uploaded_at,
    )


@router.get("/patients/{patient_id}", response_model=list[DocumentUploadResponse])
def list_patient_documents(patient_id: int, session: Session = Depends(get_session)):
    documents = session.exec(select(Document).where(Document.patient_id == patient_id)).all()
    return [
        DocumentUploadResponse(
            document_id=doc.id,
            filename=doc.filename,
            kind=doc.kind,
            patient_id=doc.patient_id,
            uploaded_at=doc.uploaded_at,
        )
        for doc in documents
    ]
