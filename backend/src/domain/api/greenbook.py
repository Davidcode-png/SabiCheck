from fastapi import APIRouter, HTTPException, Query, status

from src.core.db.dependencies import CurrentUser, DBSession
from src.domain.schemas.greenbook import (
    GreenbookProductList,
    GreenbookProductRead,
    GreenbookStatusRead,
    GreenbookSyncRunRead,
)
from src.domain.services import greenbook as greenbook_service

router = APIRouter(prefix="/greenbook", tags=["greenbook"])


@router.get("/products", response_model=GreenbookProductList)
async def list_greenbook_products(
    current_user: CurrentUser,
    session: DBSession,
    query: str | None = Query(
        default=None, description="Match product name or NAFDAC number"
    ),
    nrn: str | None = Query(
        default=None, description="Exact NAFDAC registration number"
    ),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> GreenbookProductList:
    """Search the local NAFDAC Greenbook snapshot."""
    products, total = await greenbook_service.search_greenbook_products(
        session,
        query=query,
        nrn=nrn,
        limit=limit,
        offset=offset,
    )

    return GreenbookProductList(
        items=[
            GreenbookProductRead.model_validate(product)
            for product in products
        ],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/products/{greenbook_product_id}", response_model=GreenbookProductRead
)
async def get_greenbook_product(
    greenbook_product_id: int,
    current_user: CurrentUser,
    session: DBSession,
) -> GreenbookProductRead:
    product = await greenbook_service.get_greenbook_product(
        session, greenbook_product_id
    )
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Greenbook product not found",
        )

    return GreenbookProductRead.model_validate(product)


@router.get("/status", response_model=GreenbookStatusRead)
async def get_greenbook_status(
    current_user: CurrentUser,
    session: DBSession,
) -> GreenbookStatusRead:
    total = await greenbook_service.count_greenbook_products(session)
    latest = await greenbook_service.get_latest_sync_run(session)

    return GreenbookStatusRead(
        total_products=total,
        latest_sync=(
            GreenbookSyncRunRead.model_validate(latest) if latest else None
        ),
    )
