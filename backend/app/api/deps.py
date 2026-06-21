from collections.abc import Callable

from fastapi import Depends, Header, status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import decode_access_token
from app.database.session import get_db
from app.models.user import User


def get_current_user(authorization: str = Header(default=""), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise AppError("Missing bearer token", status.HTTP_401_UNAUTHORIZED)
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise AppError("Invalid bearer token", status.HTTP_401_UNAUTHORIZED) from exc
    user = db.get(User, int(payload["sub"]))
    if not user or not user.is_active:
        raise AppError("User not found or inactive", status.HTTP_401_UNAUTHORIZED)
    return user


def require_role(*roles: str) -> Callable:
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise AppError("Insufficient permissions", status.HTTP_403_FORBIDDEN)
        return user

    return dependency
