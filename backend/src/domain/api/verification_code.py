import csv
import io
import re
import uuid

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from src.core.db.dependencies import CurrentUser, DBSession
from src.domain.models.organization import Organization, OrganizationRole
from src.domain.models.product import Product
from src.domain.models.verification_code import (
    VerificationCode,
    VerificationCodeOrder,
    VerificationCodeStatus,
)
from src.domain.schemas.verification_code import (
    VerificationCodeBulkAssign,
    VerificationCodeBulkAssignResponse,
    VerificationCodeDistributor,
    VerificationCodeList,
    VerificationCodeOrderCreate,
    VerificationCodeOrderCreateResponse,
    VerificationCodeOrderRead,
    VerificationCodeRead,
    VerificationCodeSummary,
    VerificationCodeUpdate,
)
from src.domain.services import organization as organization_service
from src.domain.services import product as product_service
from src.domain.services import verification_code as verification_code_service

router = APIRouter(
    prefix="/organizations/{organization_id}/products/{product_id}",
    tags=["verification-codes"],
)

_MANAGER_ROLES = {OrganizationRole.OWNER, OrganizationRole.ADMIN}


def _not_found(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to manage this organization",
    )


async def _organization_with_access(
    session: DBSession,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
    *,
    roles: set[OrganizationRole] | None = None,
) -> Organization:
    try:
        organization, _ = await organization_service.get_organization_for_user(
            session, organization_id, user_id, roles=roles
        )
    except organization_service.OrganizationNotFoundError:
        raise _not_found("Organization not found") from None
    except organization_service.OrganizationPermissionError:
        raise _forbidden() from None

    return organization


async def _get_product(
    session: DBSession,
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
) -> Product:
    try:
        return await product_service.get_product(
            session, organization_id, product_id
        )
    except product_service.ProductNotFoundError:
        raise _not_found("Product not found") from None


def _order_to_read(
    order: VerificationCodeOrder, batch_no: str | None = None
) -> VerificationCodeOrderRead:
    resolved_batch_no = (
        batch_no
        if batch_no is not None
        else (order.batch.batch_no if order.batch else None)
    )

    return VerificationCodeOrderRead(
        id=order.id,
        reference=order.reference,
        product_id=order.product_id,
        batch_id=order.batch_id,
        batch_no=resolved_batch_no,
        quantity=order.quantity,
        unit_price_kobo=order.unit_price_kobo,
        service_fee_kobo=order.service_fee_kobo,
        total_amount_kobo=order.total_amount_kobo,
        payment_method=order.payment_method,
        status=order.status,
        paid_at=order.paid_at,
        created_at=order.created_at,
    )


def _code_to_read(code: VerificationCode) -> VerificationCodeRead:
    return VerificationCodeRead(
        id=code.id,
        code=code.code,
        product_id=code.product_id,
        batch_id=code.batch_id,
        batch_no=code.batch.batch_no if code.batch else None,
        order_id=code.order_id,
        distributor_id=code.distributor_id,
        distributor=(
            VerificationCodeDistributor.model_validate(code.distributor)
            if code.distributor
            else None
        ),
        status=code.status,
        status_changed_at=code.status_changed_at,
        created_at=code.created_at,
    )


@router.post(
    "/code-orders",
    response_model=VerificationCodeOrderCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_code_order(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: VerificationCodeOrderCreate,
    current_user: CurrentUser,
    session: DBSession,
) -> VerificationCodeOrderCreateResponse:
    organization = await _organization_with_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )
    product = await _get_product(session, organization_id, product_id)

    try:
        order, generated = await verification_code_service.create_order(
            session, organization, product, payload
        )
    except verification_code_service.ProductBatchRequiredError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "batch_required",
                "message": (
                    "Assign a manufacturing batch to this product before "
                    "purchasing verification codes."
                ),
            },
        ) from None
    except verification_code_service.ManufacturerPrefixInvalidError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "manufacturer_prefix_required",
                "message": (
                    "Set a three-character manufacturer code prefix in company "
                    "settings before purchasing verification codes."
                ),
            },
        ) from None
    except verification_code_service.VerificationCodeGenerationError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "The verification codes could not be generated. Please try "
                "again."
            ),
        ) from None

    batch_no = product.batch.batch_no if product.batch else None

    return VerificationCodeOrderCreateResponse(
        order=_order_to_read(order, batch_no),
        codes_generated=generated,
    )


@router.get("/code-orders", response_model=list[VerificationCodeOrderRead])
async def list_code_orders(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    limit: int = Query(default=50, ge=1, le=100),
) -> list[VerificationCodeOrderRead]:
    await _organization_with_access(
        session, organization_id, current_user.id
    )
    await _get_product(session, organization_id, product_id)

    orders = await verification_code_service.list_orders(
        session, product_id, limit=limit
    )

    return [_order_to_read(order) for order in orders]


@router.get("/verification-codes", response_model=VerificationCodeList)
async def list_verification_codes(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    code_status: VerificationCodeStatus | None = Query(
        default=None, alias="status"
    ),
    search: str | None = Query(default=None, max_length=32),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
) -> VerificationCodeList:
    await _organization_with_access(
        session, organization_id, current_user.id
    )
    await _get_product(session, organization_id, product_id)

    codes, total, counts = await verification_code_service.list_codes(
        session,
        product_id,
        status=code_status,
        search=search,
        page=page,
        page_size=page_size,
    )

    return VerificationCodeList(
        items=[_code_to_read(code) for code in codes],
        total=total,
        page=page,
        page_size=page_size,
        pages=verification_code_service.page_count(total, page_size),
        status_counts=counts,
    )


@router.get(
    "/verification-codes/summary", response_model=VerificationCodeSummary
)
async def get_verification_code_summary(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> VerificationCodeSummary:
    organization = await _organization_with_access(
        session, organization_id, current_user.id
    )
    product = await _get_product(session, organization_id, product_id)

    counts, batch_no, prefix = await verification_code_service.get_summary(
        session, product, organization.manufacturer_prefix
    )

    return VerificationCodeSummary(
        total=counts.total,
        unused=counts.unused,
        verified=counts.verified,
        used=counts.used,
        reported=counts.reported,
        batch_no=batch_no,
        manufacturer_prefix=prefix,
    )


@router.get("/verification-codes/export")
async def export_verification_codes(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    code_status: VerificationCodeStatus | None = Query(
        default=None, alias="status"
    ),
    search: str | None = Query(default=None, max_length=32),
) -> StreamingResponse:
    """Download the filtered code list as a CSV that opens in Excel."""
    await _organization_with_access(
        session, organization_id, current_user.id
    )
    product = await _get_product(session, organization_id, product_id)

    codes = await verification_code_service.export_codes(
        session,
        product_id,
        status=code_status,
        search=search,
    )

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "Code",
            "Status",
            "Batch",
            "Product",
            "Distributor",
            "Location",
            "Order ID",
            "Created at",
            "Status changed at",
        ]
    )

    for code in codes:
        distributor = code.distributor
        writer.writerow(
            [
                code.code,
                code.status.value,
                code.batch.batch_no if code.batch else "",
                product.name,
                distributor.name if distributor else "",
                (
                    distributor.city or distributor.state
                    if distributor
                    else ""
                )
                or "",
                str(code.order_id) if code.order_id else "",
                code.created_at.isoformat(),
                code.status_changed_at.isoformat()
                if code.status_changed_at
                else "",
            ]
        )

    safe_sku = re.sub(r"[^A-Za-z0-9._-]+", "-", product.sku).strip("-")
    filename = f"verification-codes-{safe_sku or 'product'}.csv"

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.patch(
    "/verification-codes",
    response_model=VerificationCodeBulkAssignResponse,
)
async def bulk_assign_verification_codes(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    payload: VerificationCodeBulkAssign,
    current_user: CurrentUser,
    session: DBSession,
) -> VerificationCodeBulkAssignResponse:
    """Assign many codes to one distributor, or clear their distributor."""
    await _organization_with_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )
    await _get_product(session, organization_id, product_id)

    try:
        codes = await verification_code_service.bulk_assign_distributor(
            session,
            organization_id,
            product_id,
            payload.code_ids,
            payload.distributor_id,
        )
    except verification_code_service.VerificationCodeNotFoundError:
        raise _not_found(
            "One or more verification codes were not found"
        ) from None
    except verification_code_service.VerificationCodeDistributorNotFoundError:
        raise _not_found(
            "Distributor not found in this organization"
        ) from None

    return VerificationCodeBulkAssignResponse(
        updated=len(codes),
        items=[_code_to_read(code) for code in codes],
    )


@router.patch(
    "/verification-codes/{code_id}", response_model=VerificationCodeRead
)
async def update_verification_code_status(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    code_id: uuid.UUID,
    payload: VerificationCodeUpdate,
    current_user: CurrentUser,
    session: DBSession,
) -> VerificationCodeRead:
    await _organization_with_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )
    await _get_product(session, organization_id, product_id)

    try:
        code = await verification_code_service.update_code(
            session, organization_id, product_id, code_id, payload
        )
    except verification_code_service.VerificationCodeNotFoundError:
        raise _not_found("Verification code not found") from None
    except verification_code_service.VerificationCodeDistributorNotFoundError:
        raise _not_found(
            "Distributor not found in this organization"
        ) from None

    return _code_to_read(code)
