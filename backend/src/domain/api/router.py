from fastapi import APIRouter

from src.domain.api.auth import router as auth_router
from src.domain.api.assistant import router as assistant_router
from src.domain.api.distributor import router as distributor_router
from src.domain.api.greenbook import router as greenbook_router
from src.domain.api.organization import router as organization_router
from src.domain.api.overview import router as overview_router
from src.domain.api.product import router as product_router
from src.domain.api.public_code import router as public_code_router
from src.domain.api.report import router as report_router
from src.domain.api.verification import router as verification_router
from src.domain.api.verification_code import router as verification_code_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(assistant_router)
api_router.include_router(distributor_router)
api_router.include_router(greenbook_router)
api_router.include_router(organization_router)
api_router.include_router(overview_router)
api_router.include_router(product_router)
api_router.include_router(report_router)
api_router.include_router(verification_router)
api_router.include_router(verification_code_router)
api_router.include_router(public_code_router)
