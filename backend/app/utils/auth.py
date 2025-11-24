from datetime import datetime, timedelta
from typing import Optional

import jwt  # PyJWT

from ..config import settings


def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT for the given subject (username).
    """
    to_encode = {"sub": subject}
    if expires_delta is None:
        expires_delta = timedelta(hours=4)

    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode the JWT and return the username (sub) if valid, else None.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except jwt.ExpiredSignatureError:
        # Token expired
        return None
    except jwt.PyJWTError:
        # Invalid token
        return None
