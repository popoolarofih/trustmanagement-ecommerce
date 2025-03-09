"use client"

import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, ShieldCheck, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Product } from "@/lib/types"
import { useCart } from "@/hooks/use-cart.client"
import { useAuth } from "@/hooks/use-auth"
import {toast} from "sonner"

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const slug = product.name.toLowerCase().replace(/\s+/g, "-")
  const { addToCart } = useCart()
  const { user } = useAuth()
  // const { toast } = useToast()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to add items to your cart",
        variant: "destructive",
      })
      return
    }

    addToCart(product)

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    })
  }

  // Get trust badge variant
  const getTrustBadgeVariant = (score: number) => {
    if (score >= 4.5) return "success"
    if (score >= 3.5) return "default"
    if (score >= 2.5) return "warning"
    return "destructive"
  }

  // Get trust level text
  const getTrustLevelText = (score: number) => {
    if (score >= 4.5) return "Highly Trusted"
    if (score >= 3.5) return "Trusted"
    if (score >= 2.5) return "Moderate Trust"
    return "Low Trust"
  }

  return (
    <div className="product-card group relative">
      {product.price < (product.originalPrice || product.price) && (
        <div className="badge-discount">
          {Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)}% OFF
        </div>
      )}

      <Link href={`/products/${slug}`} className="block mb-4">
        <div className="relative h-40 w-full mb-3 img-hover-zoom">
          <Image
            src={product.imageUrl || "/placeholder.svg?height=160&width=160"}
            alt={product.name}
            fill
            className="object-contain"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">{product.vendorName}</p>

          {product.trustScore && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant={getTrustBadgeVariant(product.trustScore)} className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {product.trustScore.toFixed(1)}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTrustLevelText(product.trustScore)} Vendor</p>
                  <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < Math.floor(product.trustScore) ? "fill-current text-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <h3 className="font-medium line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-400 mt-1">{product.category}</p>
      </Link>

      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-1">
            <span className="price">${product.price.toFixed(2)}</span>
            {product.price < (product.originalPrice || product.price) && (
              <span className="price-original">${product.originalPrice!.toFixed(2)}</span>
            )}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full h-10 w-10 hover:bg-primary hover:text-primary-foreground"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

