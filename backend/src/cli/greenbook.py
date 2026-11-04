"""Command line tools for the local NAFDAC Greenbook snapshot.

Examples (run from the ``backend`` directory)::

    python -m src.cli.greenbook sync --limit 40
    python -m src.cli.greenbook sync --limit 0        # scrape everything
    python -m src.cli.greenbook search --query paracetamol
    python -m src.cli.greenbook search --nrn A4-100160
    python -m src.cli.greenbook export --output greenbook_snapshot.csv
    python -m src.cli.greenbook status
"""

import argparse
import asyncio
import sys
from pathlib import Path

from src.core.config import settings
from src.core.db.base import AsyncSessionLocal
from src.domain.services import greenbook as greenbook_service


def _short(value: str | None, width: int = 42) -> str:
    text = (value or "").replace("\n", " ").strip()
    if len(text) <= width:
        return text
    return text[: width - 1] + "…"


def _print_products(products) -> None:
    if not products:
        print("No products found.")
        return

    header = f"{'NRN':<16} {'NAME':<44} {'STATUS':<12} {'CATEGORY':<24}"
    print(header)
    print("-" * len(header))
    for product in products:
        print(
            f"{_short(product.nrn, 16):<16} "
            f"{_short(product.product_name, 44):<44} "
            f"{_short(product.status, 12):<12} "
            f"{_short(product.product_category, 24):<24}"
        )


async def _sync(args: argparse.Namespace) -> int:
    print(
        "Syncing Greenbook snapshot "
        f"(limit={args.limit or 'all'}, start={args.start}, "
        f"page_size={args.page_size})..."
    )
    async with AsyncSessionLocal() as session:
        run = await greenbook_service.sync_greenbook_products(
            session,
            limit=args.limit,
            start=args.start,
            page_size=args.page_size,
            delay_seconds=args.delay,
            search=args.search,
        )

    print(
        f"Sync {run.status}: fetched={run.fetched_count}, "
        f"inserted={run.inserted_count}, updated={run.updated_count}"
    )
    return 0


async def _search(args: argparse.Namespace) -> int:
    async with AsyncSessionLocal() as session:
        products, total = await greenbook_service.search_greenbook_products(
            session,
            query=args.query,
            nrn=args.nrn,
            limit=args.limit,
            offset=args.offset,
        )

    _print_products(products)
    print(f"\nShowing {len(products)} of {total} matching products.")
    return 0


async def _export(args: argparse.Namespace) -> int:
    async with AsyncSessionLocal() as session:
        if args.query or args.nrn:
            products, total = (
                await greenbook_service.search_greenbook_products(
                    session,
                    query=args.query,
                    nrn=args.nrn,
                    limit=1_000_000,
                    offset=0,
                )
            )
        else:
            products = await greenbook_service.list_greenbook_products(
                session, limit=1_000_000
            )
            total = len(products)

    output_path = greenbook_service.export_greenbook_csv(
        products, Path(args.output)
    )
    print(f"Exported {total} products to {output_path}")
    return 0


async def _status(args: argparse.Namespace) -> int:
    async with AsyncSessionLocal() as session:
        total = await greenbook_service.count_greenbook_products(session)
        latest = await greenbook_service.get_latest_sync_run(session)

    print(f"Products in snapshot: {total}")
    if latest is None:
        print("No sync has run yet.")
        return 0

    print(
        f"Latest sync: {latest.status} at "
        f"{latest.started_at.isoformat()} "
        f"(fetched={latest.fetched_count}, "
        f"inserted={latest.inserted_count}, "
        f"updated={latest.updated_count})"
    )
    if latest.error_message:
        print(f"Error: {latest.error_message}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m src.cli.greenbook",
        description="Manage the local NAFDAC Greenbook snapshot.",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    sync_parser = subparsers.add_parser(
        "sync", help="Scrape the Greenbook and upsert records locally."
    )
    sync_parser.add_argument(
        "--limit",
        type=int,
        default=settings.GREENBOOK_SYNC_LIMIT,
        help="Maximum records to fetch. Use 0 to fetch every record.",
    )
    sync_parser.add_argument(
        "--start",
        type=int,
        default=0,
        help="Greenbook row offset to start at.",
    )
    sync_parser.add_argument(
        "--page-size",
        type=int,
        default=settings.GREENBOOK_SYNC_PAGE_SIZE,
        help="Records requested per Greenbook page.",
    )
    sync_parser.add_argument(
        "--delay",
        type=float,
        default=settings.GREENBOOK_REQUEST_DELAY_SECONDS,
        help="Seconds to wait between pages.",
    )
    sync_parser.add_argument(
        "--search",
        default="",
        help="Only sync rows matching this Greenbook search term.",
    )
    sync_parser.set_defaults(handler=_sync)

    search_parser = subparsers.add_parser(
        "search", help="Search the local snapshot."
    )
    search_parser.add_argument("--query", help="Product name or NRN text.")
    search_parser.add_argument(
        "--nrn", help="Exact NAFDAC registration number."
    )
    search_parser.add_argument("--limit", type=int, default=20)
    search_parser.add_argument("--offset", type=int, default=0)
    search_parser.set_defaults(handler=_search)

    export_parser = subparsers.add_parser(
        "export", help="Write the snapshot to an Excel-friendly CSV."
    )
    export_parser.add_argument(
        "--output",
        default="greenbook_snapshot.csv",
        help="Destination CSV path.",
    )
    export_parser.add_argument("--query", help="Only export matching names.")
    export_parser.add_argument("--nrn", help="Only export this NRN.")
    export_parser.set_defaults(handler=_export)

    status_parser = subparsers.add_parser(
        "status", help="Show snapshot size and the latest sync run."
    )
    status_parser.set_defaults(handler=_status)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return asyncio.run(args.handler(args))
    except KeyboardInterrupt:
        print("Interrupted.", file=sys.stderr)
        return 130


if __name__ == "__main__":
    raise SystemExit(main())
