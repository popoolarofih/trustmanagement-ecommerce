import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Box } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaleProductCardProps {
  brand: string;
  name: string;
  price: number;
  originalPrice: number;
  weight: string;
  discount?: string;
  image?: string;
}

export default function SaleProductCard({
  brand,
  name,
  price,
  originalPrice,
  weight,
  discount,
  image,
}: SaleProductCardProps) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const hasDiscount = price < originalPrice;

  return (
    <div className="product-card card-hover p-4 bg-card rounded-lg shadow-md transition-all">
      {discount && <div className="badge-discount">{discount}</div>}
      <Link href={`/product/${slug}`} className="block mb-4 img-hover-zoom">
        <div className="relative h-40 w-full mb-3 flex items-center justify-center">
          {image ? (
            <Image src={image} alt={name} fill className="object-contain" />
          ) : (
            <Box className="h-16 w-16 text-muted-foreground" />
          )}
        </div>
        <p className="text-muted-foreground text-sm">{brand}</p>
        <h3 className="font-medium line-clamp-1">{name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{weight}</p>
      </Link>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          <span className="price">${price.toFixed(1)}</span>
          {hasDiscount && (
            <span className="price-original text-sm text-muted-foreground line-through">
              ${originalPrice.toFixed(1)}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-10 w-10 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
