from pydantic import BaseModel
from typing import Optional, List


# ==== Chat ====

class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    language: str
    intent: str
    from_faq: bool


# ==== FAQ ====

class FAQBase(BaseModel):
    question: str
    answer: str
    language: str
    tags: Optional[str] = None


class FAQCreate(FAQBase):
    pass


class FAQRead(FAQBase):
    id: int

    class Config:
        orm_mode = True
