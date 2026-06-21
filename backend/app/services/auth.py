from fastapi import status

from app.core.exceptions import AppError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.repositories.users import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    def __init__(self, users: UserRepository) -> None:
        self.users = users

    def register(self, payload: RegisterRequest) -> User:
        if self.users.get_by_email(payload.email):
            raise AppError("Email is already registered", status.HTTP_409_CONFLICT)
        return self.users.create(payload.email, payload.full_name, hash_password(payload.password))

    def login(self, payload: LoginRequest) -> TokenResponse:
        user = self.users.get_by_email(payload.email)
        if not user or not verify_password(payload.password, user.hashed_password):
            raise AppError("Invalid email or password", status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            raise AppError("User account is disabled", status.HTTP_403_FORBIDDEN)
        return TokenResponse(access_token=create_access_token(str(user.id), user.role))
