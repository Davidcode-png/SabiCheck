import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.datastructures import UploadFile

from src.domain.models.attachment import FileAttachment
from src.domain.models.product import Product, ProductBatch
from src.domain.schemas.product import ProductCreate
from src.domain.services import attachment as attachment_service
from src.domain.services import greenbook as greenbook_service


class ProductNotFoundError(Exception):
    pass


class ProductSkuConflictError(Exception):
    pass


class ProductNrnNotFoundError(Exception):
    """Raised when a product's NAFDAC number is not in the Greenbook."""

    def __init__(self, nrn: str):
        self.nrn = nrn
        super().__init__(nrn)


async def list_products(
    session: AsyncSession, organization_id: uuid.UUID
) -> list[Product]:
    result = await session.execute(
        select(Product)
        .where(Product.organization_id == organization_id)
        .order_by(Product.created_at.desc())
    )
    return list(result.scalars().unique().all())


async def get_product(
    session: AsyncSession,
    organization_id: uuid.UUID,
    product_id: uuid.UUID,
) -> Product:
    result = await session.execute(
        select(Product).where(
            Product.id == product_id,
            Product.organization_id == organization_id,
        )
    )
    product = result.scalar_one_or_none()

    if product is None:
        raise ProductNotFoundError

    return product


async def _resolve_batch(
    session: AsyncSession,
    organization_id: uuid.UUID,
    batch_no: str | None,
) -> ProductBatch | None:
    if not batch_no:
        return None

    result = await session.execute(
        select(ProductBatch).where(
            ProductBatch.organization_id == organization_id,
            ProductBatch.batch_no == batch_no,
        )
    )
    batch = result.scalar_one_or_none()

    if batch is None:
        batch = ProductBatch(
            organization_id=organization_id,
            batch_no=batch_no,
        )
        session.add(batch)
        await session.flush()

    return batch


async def create_product(
    session: AsyncSession,
    organization_id: uuid.UUID,
    data: ProductCreate,
) -> Product:
    greenbook_product = await greenbook_service.get_greenbook_product_by_nrn(
        session, data.reg_no
    )
    if greenbook_product is None:
        raise ProductNrnNotFoundError(data.reg_no)

    existing = await session.execute(
        select(Product.id).where(
            Product.organization_id == organization_id,
            Product.sku == data.sku,
        )
    )

    if existing.scalar_one_or_none() is not None:
        raise ProductSkuConflictError

    batch = await _resolve_batch(session, organization_id, data.batch_no)

    product = Product(
        **data.model_dump(exclude={"batch_no"}),
        organization_id=organization_id,
        batch_id=batch.id if batch else None,
    )
    session.add(product)
    await session.flush()

    return product


async def list_product_images(
    session: AsyncSession,
    product_ids: list[uuid.UUID],
) -> dict[uuid.UUID, FileAttachment]:
    """Return the latest attachment for each product, keyed by product id."""
    if not product_ids:
        return {}

    result = await session.execute(
        select(FileAttachment)
        .where(
            FileAttachment.entity_type == "products",
            FileAttachment.entity_id.in_(product_ids),
        )
        .order_by(FileAttachment.created_at)
    )

    images: dict[uuid.UUID, FileAttachment] = {}
    for attachment in result.scalars().all():
        images[attachment.entity_id] = attachment

    return images


async def get_product_image(
    session: AsyncSession, product: Product
) -> FileAttachment | None:
    images = await list_product_images(session, [product.id])
    return images.get(product.id)


async def replace_product_image(
    session: AsyncSession,
    product: Product,
    file: UploadFile,
    *,
    uploaded_by_id: uuid.UUID,
    folder: str,
) -> FileAttachment:
    """Upload a new image, then remove the previous product image."""
    existing = await attachment_service.list_attachments(session, product)

    uploaded = await attachment_service.upload_attachments(
        session,
        product,
        [file],
        uploaded_by_id=uploaded_by_id,
        folder=folder,
    )

    for attachment in existing:
        await attachment_service.delete_attachment(
            session, product, attachment.id
        )

    return uploaded[0]


async def delete_product(session: AsyncSession, product: Product) -> None:
    attachments = await attachment_service.list_attachments(session, product)

    for attachment in attachments:
        await attachment_service.delete_attachment(
            session, product, attachment.id
        )

    await session.delete(product)
    await session.flush()
