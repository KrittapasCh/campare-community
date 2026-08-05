import Link from "next/link";
import ProductThumb from "@/components/product-thumb";
import StarRating from "@/components/star-rating";
import WishlistButton from "@/components/wishlist-button";
import { formatPrice } from "@/lib/format";
import { PRODUCT_TYPE_LABEL, STATUS_LABEL, type Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const price = product.market_price ?? product.msrp;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-ink-100 bg-white transition hover:border-brand-300 hover:shadow-lg hover:shadow-brand-100/50">
      <div className="absolute right-2 top-2 z-10">
        <WishlistButton productId={product.id} />
      </div>

      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-4/3 overflow-hidden bg-ink-50">
          <ProductThumb
            src={product.thumbnail_url}
            alt={product.name}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="transition duration-300 group-hover:scale-105"
          />
          {product.status === "discontinued" && (
            <span className="absolute left-2 top-2 rounded-md bg-ink-800/85 px-2 py-1 text-[11px] font-medium text-white">
              เลิกผลิตแล้ว
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="text-[11px] uppercase tracking-wide text-ink-400">
          {product.companies?.name} · {PRODUCT_TYPE_LABEL[product.product_type]}
        </p>

        <Link href={`/product/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-brand-600">
            {product.name}
          </h3>
        </Link>

        <p className="text-xs text-ink-400">#{product.product_no}</p>

        <StarRating value={product.avg_rating} count={product.review_count} />

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <p className="text-base font-bold text-brand-600">
              {formatPrice(price)}
            </p>
            {product.market_price && product.msrp && (
              <p className="text-[11px] text-ink-400">
                ป้าย {formatPrice(product.msrp)}
              </p>
            )}
          </div>
          <span className="text-[11px] text-ink-400">
            {STATUS_LABEL[product.status]}
          </span>
        </div>
      </div>
    </article>
  );
}
