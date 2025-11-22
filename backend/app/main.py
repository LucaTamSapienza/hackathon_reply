from fastapi import FastAPI

from .api import routes_consultations, routes_documents, routes_health, routes_patients, routes_records
from .config import get_settings
from .db import init_db


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
    )

    app.include_router(routes_health.router)
    app.include_router(routes_patients.router)
    app.include_router(routes_consultations.router)
    app.include_router(routes_documents.router)
    app.include_router(routes_records.router)

    @app.on_event("startup")
    def _startup() -> None:
        init_db()

    return app


app = create_app()
