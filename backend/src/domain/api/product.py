import uuid
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from src.core.config import settings
from src.core.db.dependencies import CurrentUser, DBSession
from src.core.storage import (
    InvalidFileError,
    StorageNotConfiguredError,
    StorageUploadError,
)
from src.domain.models.attachment import FileAttachment
from src.domain.models.organization import OrganizationRole
from src.domain.models.product import Product
from src.domain.schemas.attachment import FileAttachmentRead
from src.domain.schemas.product import ProductCreate, ProductRead
from src.domain.services import organization as organization_service
from src.domain.services import product as product_service

router = APIRouter(
    prefix="/organizations/{organization_id}/products",
    tags=["products"],
)

_MANAGER_ROLES = {OrganizationRole.OWNER, OrganizationRole.ADMIN}
_PRODUCT_IMAGE_TYPES = {"image/png", "image/jpeg"}


def _not_found(detail: str = "Product not found") -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _forbidden() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to manage this organization",
    )


async def _require_organization_access(
    session: DBSession,
    organization_id: uuid.UUID,
    user_id: uuid.UUID,
    *,
    roles: set[OrganizationRole] | None = None,
) -> None:
    try:
        await organization_service.get_organization_for_user(
            session, organization_id, user_id, roles=roles
        )
    except organization_service.OrganizationNotFoundError:
        raise _not_found("Organization not found") from None
    except organization_service.OrganizationPermissionError:
        raise _forbidden() from None


def _to_read(
    product: Product, image: FileAttachment | None = None
) -> ProductRead:
    return ProductRead(
        id=product.id,
        organization_id=product.organization_id,
        name=product.name,
        sku=product.sku,
        brand_name=product.brand_name,
        category=product.category,
        batch_id=product.batch_id,
        batch_no=product.batch.batch_no if product.batch else None,
        description=product.description,
        packaging_type=product.packaging_type,
        unit=product.unit,
        pack_size=product.pack_size,
        reg_no=product.reg_no,
        barcode=product.barcode,
        image=FileAttachmentRead.model_validate(image) if image else None,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


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
        raise _not_found() from None


@router.post(
    "",
    response_model=ProductRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_product(
    organization_id: uuid.UUID,
    payload: ProductCreate,
    current_user: CurrentUser,
    session: DBSession,
) -> ProductRead:
    await _require_organization_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )

    try:
        created = await product_service.create_product(
            session, organization_id, payload
        )
    except product_service.ProductNrnNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "code": "nrn_not_found",
                "message": (
                    "This is not a valid NAFDAC code. "
                    "Check the number and try again."
                ),
                "nrn": exc.nrn,
            },
        ) from None
    except product_service.ProductSkuConflictError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A product with this SKU already exists in this organization",
        ) from None

    product = await _get_product(session, organization_id, created.id)
    image = await product_service.get_product_image(session, product)

    return _to_read(product, image)


@router.get("", response_model=list[ProductRead])
async def list_products(
    organization_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> list[ProductRead]:
    await _require_organization_access(
        session, organization_id, current_user.id
    )

    products = await product_service.list_products(session, organization_id)
    images = await product_service.list_product_images(
        session, [product.id for product in products]
    )

    return [_to_read(product, images.get(product.id)) for product in products]


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> ProductRead:
    await _require_organization_access(
        session, organization_id, current_user.id
    )

    product = await _get_product(session, organization_id, product_id)
    image = await product_service.get_product_image(session, product)

    return _to_read(product, image)


@router.post("/{product_id}/image", response_model=ProductRead)
async def upload_product_image(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
    file: Annotated[
        UploadFile,
        File(description="Product image: PNG or JPG up to 10MB"),
    ],
) -> ProductRead:
    await _require_organization_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )
    product = await _get_product(session, organization_id, product_id)

    if (file.content_type or "").lower() not in _PRODUCT_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload a PNG or JPG image.",
        )

    try:
        await product_service.replace_product_image(
            session,
            product,
            file,
            uploaded_by_id=current_user.id,
            folder=(
                f"{settings.CLOUDINARY_UPLOAD_FOLDER}/"
                f"{organization_id}/products"
            ),
        )
    except InvalidFileError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from None
    except StorageNotConfiguredError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="File storage is not configured",
        ) from None
    except StorageUploadError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The product image could not be uploaded. Please try again.",
        ) from None

    image = await product_service.get_product_image(session, product)
    return _to_read(product, image)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: CurrentUser,
    session: DBSession,
) -> None:
    await _require_organization_access(
        session, organization_id, current_user.id, roles=_MANAGER_ROLES
    )
    product = await _get_product(session, organization_id, product_id)
    await product_service.delete_product(session, product)
