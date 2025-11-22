import shutil
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import UploadFile
from sqlmodel import Session

from ..config import Settings
from ..models import Document


def save_document(
    session: Session,
    upload: UploadFile,
    patient_id: int,
    settings: Settings,
    kind: Optional[str] = None,
) -> Document:
    storage_dir = Path(settings.storage_path)
    storage_dir.mkdir(parents=True, exist_ok=True)

    unique_name = f"{uuid4().hex}_{upload.filename}"
    file_path = storage_dir / unique_name

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)

    document = Document(
        patient_id=patient_id,
        filename=upload.filename,
        file_path=str(file_path),
        content_type=upload.content_type,
        kind=kind,
    )
    session.add(document)
    session.commit()
    session.refresh(document)
    return document
