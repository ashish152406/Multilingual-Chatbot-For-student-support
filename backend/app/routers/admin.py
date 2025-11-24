from fastapi import APIRouter, Depends, Header, HTTPException, Request
from typing import List, Optional
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..schemas import FAQCreate, FAQRead
from ..models import FAQ
from ..deps import get_db
from ..config import settings
from ..ml.faq_retrieval import FAQRetriever
from ..utils.auth import create_access_token, decode_access_token

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ====== Login models ======

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ====== Auth helpers ======

def get_current_admin(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract and validate JWT from Authorization: Bearer <token>
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = parts[1]
    username = decode_access_token(token)
    if not username or username != settings.ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return username


# ====== Routes ======

@router.post("/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest):
    """
    Admin login with username + password.
    Returns a JWT access token on success.
    """
    if (
        payload.username != settings.ADMIN_USERNAME
        or payload.password != settings.ADMIN_PASSWORD
    ):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(subject=payload.username)
    return AdminLoginResponse(access_token=token)


@router.get("/faqs", response_model=List[FAQRead])
def list_faqs(
    request: Request,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin),
):
    faqs = db.query(FAQ).order_by(FAQ.id.desc()).all()
    return faqs


@router.post("/faqs", response_model=FAQRead)
def create_faq(
    payload: FAQCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin),
):
    faq = FAQ(
        question=payload.question,
        answer=payload.answer,
        language=payload.language,
        tags=payload.tags,
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)

    # Refresh FAQ retriever so new FAQ is used immediately
    faq_retriever: FAQRetriever = request.app.state.faq_retriever
    faq_retriever.refresh(db)

    return faq
