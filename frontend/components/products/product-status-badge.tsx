import { cn } from "@/lib/cn";
import {
  PRODUCT_STATUS_LABELS,
  type ProductStatus,
} from "@/lib/product-registry";

const STATUS_STYLES: Record<ProductStatus, string> = {
  registered: "bg-dash-tint text-brand-ink",
  verified: "bg-dash-tint text-dash-teal",
  "pending-review": "bg-warn-soft text-warn-ink",
};

export function ProductStatusBadge({
  status,
  className,
}: {
  status: ProductStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold leading-4",
        STATUS_STYLES[status],
        className,
      )}
    >
      {PRODUCT_STATUS_LABELS[status]}
    </span>
  );
}
