"""Pytest configuration — isolated test database setup."""
import os

# Must be set BEFORE any app import so pydantic-settings reads them.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_hawkvision.db")
os.environ.setdefault("SECRET_KEY", "test-secret-key-minimum-length")
os.environ.setdefault("ENABLE_REAL_INFERENCE", "false")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.database.base import Base  # noqa: E402
from app.database.session import engine  # noqa: E402
from app.main import app  # noqa: E402


def pytest_configure(config) -> None:  # noqa: ANN001
    """Safeguard: assert test DB is active before any test runs."""
    assert "test" in settings.database_url, (
        f"Tests must use a test database, got: {settings.database_url!r}. "
        "Set DATABASE_URL=sqlite:///./test_hawkvision.db in environment."
    )
    assert not settings.enable_real_inference, (
        "Tests must run with ENABLE_REAL_INFERENCE=false to avoid loading YOLO."
    )


@pytest.fixture()
def client():
    """Provide a fresh TestClient with a clean database for each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
