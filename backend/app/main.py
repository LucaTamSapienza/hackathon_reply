from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import routes_consultations, routes_documents, routes_health, routes_patients, routes_records
from .config import get_settings
from .db import init_db


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
    )

    # Allow local testing from file:// or localhost frontends.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
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
