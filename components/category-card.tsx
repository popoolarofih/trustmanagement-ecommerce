import Link from "next/link";
import { Grid } from "lucide-react";

interface CategoryCardProps {
  name: string;
  icon?: string;
}

export default function CategoryCard({ name, icon }: CategoryCardProps) {
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  return (
    <Link href={`/category/${slug}`}>
      <div className="category-card flex flex-col items-center justify-center p-4 rounded-lg bg-gradient-to-b from-background to-muted border transition-all duration-300 hover:shadow-md">
        <div className="w-16 h-16 mb-4 relative animate-float flex items-center justify-center">
          {icon ? (
            <img src={icon} alt={name} className="object-contain" />
          ) : (
            <Grid className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <h3 className="text-sm font-medium hover-underline">{name}</h3>
      </div>
    </Link>
  );
}
