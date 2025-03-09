import Image from "next/image";
import Link from "next/link";
import { Briefcase } from "lucide-react";

interface BrandCardProps {
  brand: string;
  name: string;
  image?: string;
}

export default function BrandCard({ brand, name, image }: BrandCardProps) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  return (
    <Link href={`/brand/${slug}`}>
      <div className="product-card card-hover img-hover-zoom bg-card rounded-lg shadow-md transition-all">
        <div className="relative h-48 w-full">
          {image ? (
            <Image src={image} alt={name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Briefcase className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-muted-foreground text-sm">{brand}</p>
          <h3 className="font-medium">{name}</h3>
        </div>
      </div>
    </Link>
  );
}
