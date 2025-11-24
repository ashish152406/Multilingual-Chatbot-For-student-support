from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from ..schemas import ChatRequest, ChatResponse
from ..deps import get_db
from ..ml.faq_retrieval import FAQRetriever

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    payload: ChatRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    text = payload.message.strip()

    lang_clf = request.app.state.language_detector
    intent_clf = request.app.state.intent_classifier
    faq_retriever: FAQRetriever = request.app.state.faq_retriever

    # 1. Detect language
    language = lang_clf.predict([text])[0]

    # 2. Predict intent
    intent = intent_clf.predict([text])[0]

    # 3. FAQ retrieval for campus-related intents
    faq_intents = {
        "fees",
        "exam_form_date",
        "library_timing",
        "scholarship",
        "exam_dates",
        "general_faq",
    }

    from_faq = False
    reply = ""

    if intent in faq_intents:
        faq, score = faq_retriever.get_best_match(db, text, language=language)
        if faq:
            reply = faq.answer
            from_faq = True

       # If no FAQ reply was found
    if not reply:

        # 1) Custom handling for greetings
        if intent == "greeting":
            if language == "hi":
                reply = "नमस्ते! मैं आपकी कैसे मदद कर सकता हूँ?"
            elif language == "mr":
                reply = "नमस्कार! मी तुम्हाला कशी मदत करू शकतो?"
            else:
                reply = "Hello! How can I assist you today?"
            return ChatResponse(
                reply=reply,
                language=language,
                intent=intent,
                from_faq=False,
            )

        # 2) Custom handling for thankyou
        if intent == "thankyou":
            if language == "hi":
                reply = "धन्यवाद! अगर आपको और मदद चाहिए तो बताएं।"
            elif language == "mr":
                reply = "धन्यवाद! आणखी मदत हवी असेल तर सांग."
            else:
                reply = "Thank you! Let me know if you need anything else."
            return ChatResponse(
                reply=reply,
                language=language,
                intent=intent,
                from_faq=False,
            )

        # 3) Custom handling for goodbye
        if intent == "goodbye":
            if language == "hi":
                reply = "अलविदा! आपका दिन शुभ हो।"
            elif language == "mr":
                reply = "निघतो! तुमचा दिवस छान जावो."
            else:
                reply = "Goodbye! Have a great day."
            return ChatResponse(
                reply=reply,
                language=language,
                intent=intent,
                from_faq=False,
            )

        # 4) Fallback for unknown/other intents
        if language == "hi":
            reply = (
                "माफ़ कीजिए, इस सवाल का सटीक जवाब मेरे पास नहीं है। "
                "कृपया कॉलेज ऑफिस या संबंधित विभाग से संपर्क करें।"
            )
        elif language == "mr":
            reply = (
                "माफ करा, या प्रश्नाचे अचूक उत्तर माझ्याकडे नाही. "
                "कृपया कॉलेज ऑफिस किंवा संबंधित विभागाशी संपर्क साधा."
            )
        else:
            reply = (
                "Sorry, I don't have an exact answer for that yet. "
                "Please contact the college office or relevant department."
            )


    return ChatResponse(
        reply=reply,
        language=language,
        intent=intent,
        from_faq=from_faq,
    )
