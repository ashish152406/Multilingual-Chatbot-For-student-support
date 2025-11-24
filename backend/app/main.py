from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import joblib

from .config import settings
from .database import Base, engine, SessionLocal
from .ml.faq_retrieval import FAQRetriever
from .routers import chat, admin
from . import models


def create_app() -> FastAPI:
    app = FastAPI(title=settings.APP_NAME)

    # 🚀 CORS FIX
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(chat.router)
    app.include_router(admin.router)

    @app.on_event("startup")
    def startup_event():
        Base.metadata.create_all(bind=engine)

        models_dir = Path(__file__).resolve().parent / "ml" / "models"

        lang_model_path = models_dir / "language_detector.joblib"
        intent_model_path = models_dir / "intent_classifier.joblib"

        language_detector = joblib.load(lang_model_path) if lang_model_path.exists() else None
        intent_classifier = joblib.load(intent_model_path) if intent_model_path.exists() else None

        app.state.language_detector = language_detector
        app.state.intent_classifier = intent_classifier

        faq_retriever = FAQRetriever()
        db = SessionLocal()
        try:
            faq_retriever.load_from_db(db)
        finally:
            db.close()

        app.state.faq_retriever = faq_retriever

        print("[startup] App initialized.")

    return app


app = create_app()
