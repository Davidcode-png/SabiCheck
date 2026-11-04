from fastapi import APIRouter, status

from src.core.db.dependencies import DBSession
from src.domain.schemas.public_code import (
    CodeCheckRead,
    CodeCheckRequest,
    CodeReportCreate,
    CodeReportRead,
)
from src.domain.services import public_code as public_code_service

router = APIRouter(prefix="/public", tags=["public"])


@router.post("/code-checks", response_model=CodeCheckRead)
async def check_code(
    payload: CodeCheckRequest, session: DBSession
) -> CodeCheckRead:
    """Check a consumer verification code without requiring an account."""
    return await public_code_service.check_code(session, payload.code)


@router.post(
    "/code-reports",
    response_model=CodeReportRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_code_report(
    payload: CodeReportCreate, session: DBSession
) -> CodeReportRead:
    """Submit a consumer concern for a product code."""
    report = await public_code_service.create_report(session, payload)
    return CodeReportRead.model_validate(report)
