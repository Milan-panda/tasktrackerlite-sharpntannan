from uuid import UUID

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()
session_signer = URLSafeTimedSerializer(settings.secret_key, salt="tasktracker-session")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def sign_session_id(session_id: UUID) -> str:
    return session_signer.dumps(str(session_id))


def unsign_session_id(value: str) -> UUID | None:
    try:
        raw_session_id = session_signer.loads(
            value,
            max_age=settings.session_expire_minutes * 60,
        )
        return UUID(raw_session_id)
    except (BadSignature, SignatureExpired, TypeError, ValueError):
        return None
