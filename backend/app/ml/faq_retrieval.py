from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..models import FAQ


class FAQRetriever:
    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.question_texts: List[str] = []
        self.faq_ids: List[int] = []
        self.matrix = None

    def load_from_db(self, db: Session):
        faqs: List[FAQ] = db.query(FAQ).all()
        self.question_texts = [faq.question for faq in faqs]
        self.faq_ids = [faq.id for faq in faqs]

        if not self.question_texts:
            self.vectorizer = None
            self.matrix = None
            return

        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=20000)
        self.matrix = self.vectorizer.fit_transform(self.question_texts)
        print(f"[FAQRetriever] Loaded {len(self.question_texts)} FAQs from DB")

    def refresh(self, db: Session):
        self.load_from_db(db)

    def get_best_match(
        self,
        db: Session,
        query: str,
        language: Optional[str] = None,
        threshold: float = 0.25,
    ) -> Tuple[Optional[FAQ], float]:
        """
        Returns (FAQ, score) or (None, 0.0)
        """
        if self.vectorizer is None or self.matrix is None or not self.question_texts:
            return None, 0.0

        # For now, ignore language filter and assume questions are general.
        # If you want per-language FAQ, you can filter DB queries & build per-language models.

        query_vec = self.vectorizer.transform([query])
        sims = cosine_similarity(query_vec, self.matrix)[0]
        best_idx = sims.argmax()
        best_score = sims[best_idx]

        if best_score < threshold:
            return None, best_score

        best_id = self.faq_ids[best_idx]
        faq = db.query(FAQ).filter(FAQ.id == best_id).first()
        return faq, float(best_score)
