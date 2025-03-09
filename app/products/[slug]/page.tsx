import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, Star, Minus, Plus, Heart, Share2, ShoppingCart, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SaleProductCard from "@/components/sale-product-card"

export default function ProductPage({ params }: { params: { slug: string } }) {
  // This would typically come from a database or API
  const product = {
    id: "1",
    name: "Fresh Organic Broccoli",
    brand: "Farmart",
    category: "Fruits & Vegetables",
    price: 6.9,
    originalPrice: 8.9,
    discount: "22% OFF",
    weight: "500g",
    inStock: true,
    description:
      "Fresh organic broccoli from our sustainable farms. High in nutrients and perfect for healthy meals. Each bunch weighs approximately 500g.",
    benefits: ["High in vitamins and minerals", "Good source of fiber", "Low in calories", "Contains antioxidants"],
    trustScores: [{ vendorId: "v1", score: 4.8 }],
    rating: 4.5,
    reviews: 128,
    images: [
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
      "/placeholder.svg?height=500&width=500",
    ],
    relatedProducts: [
      {
        brand: "Farmart",
        name: "Vimto Squash Remix Apple",
        price: 6.9,
        originalPrice: 8.9,
        weight: "454g",
        discount: "22% OFF",
        image: "/placeholder.svg?height=200&width=200",
      },
      {
        brand: "Farmart",
        name: "Taylors of Harrogate Yorkshire Tea",
        price: 10.5,
        originalPrice: 10.5,
        weight: "200g",
        image: "/placeholder.svg?height=200&width=200",
      },
      {
        brand: "Farmart",
        name: "Soft Mochi & Galeto Ice Cream",
        price: 20.99,
        originalPrice: 25.99,
        weight: "200g",
        discount: "19% OFF",
        image: "/placeholder.svg?height=200&width=200",
      },
      {
        brand: "Farmart",
        name: "Naked Noodle Egg Noodles",
        price: 8.05,
        originalPrice: 8.05,
        weight: "500g",
        image: "/placeholder.svg?height=200&width=200",
      },
    ],
  }

  // If no product is found
  if (!product) {
    notFound()
  }

  // Determine trust score class
  const getTrustScoreClass = (score: number) => {
    if (score >= 4.5) return "trust-score trust-score-high"
    if (score >= 3.5) return "trust-score trust-score-medium"
    return "trust-score trust-score-low"
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header would go here - same as in home page */}

      {/* Breadcrumb */}
      <div className="bg-muted py-4">
        <div className="responsive-container">
          <div className="flex items-center text-sm text-gray-500">
            <Link href="/" className="hover:text-primary hover-underline">
              Home
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link href="/categories" className="hover:text-primary hover-underline">
              Categories
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <Link
              href={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
              className="hover:text-primary hover-underline"
            >
              {product.category}
            </Link>
            <ChevronRight className="h-4 w-4 mx-2" />
            <span className="text-gray-700">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <section className="py-8">
        <div className="responsive-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white img-hover-zoom">
                <div className="relative h-80 w-full">
                  <Image
                    src={product.images[0] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-2 bg-white hover:border-primary cursor-pointer transition-colors"
                  >
                    <div className="relative h-20 w-full">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className={product.inStock ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}
                >
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
                <div className="stars-container">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.floor(product.rating) ? "star-filled" : "star-empty"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-500">({product.reviews} reviews)</span>
                </div>
              </div>

              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-gray-500">
                  Brand: <span className="text-gray-700">{product.brand}</span>
                </p>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <p className="text-gray-500">
                  Category:{" "}
                  <Link
                    href={`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`}
                    className="text-primary hover-underline"
                  >
                    {product.category}
                  </Link>
                </p>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <span className="price">#{product.price.toFixed(1)}</span>
                {product.price < product.originalPrice && (
                  <span className="price-original">${product.originalPrice.toFixed(1)}</span>
                )}
                {product.discount && <Badge className="bg-berry text-white">{product.discount}</Badge>}
              </div>

              <p className="text-gray-600 mb-6">{product.description}</p>

              <div className="mb-6">
                <p className="font-medium mb-2">Benefits:</p>
                <ul className="space-y-1">
                  {product.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full mr-2"></div>
                      <span className="text-gray-600">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trust Score */}
              <div className="mb-6">
                <p className="font-medium mb-2">Vendor Trust Score:</p>
                <div className={getTrustScoreClass(product.trustScores[0].score)}>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(product.trustScores[0].score) ? "star-filled" : "star-empty"}`}
                      />
                    ))}
                    <span className="ml-2 font-medium">{product.trustScores[0].score}/5</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="icon" className="rounded-none h-10">
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    value="1"
                    className="w-12 text-center border-none focus:outline-none focus:ring-0"
                  />
                  <Button variant="ghost" size="icon" className="rounded-none h-10">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="flex-grow btn-primary">
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-4 border-t border-b py-4 mb-6">
                <Button variant="link" className="flex items-center text-gray-500 hover:text-primary">
                  <RefreshCw className="h-4 w-4 mr-2" /> Compare
                </Button>
                <div className="w-px h-5 bg-gray-300"></div>
                <div className="text-sm text-gray-500">
                  SKU: <span className="text-gray-700">FP-{product.id}</span>
                </div>
                <div className="w-px h-5 bg-gray-300"></div>
                <div className="text-sm text-gray-500">
                  Weight: <span className="text-gray-700">{product.weight}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Description Tabs */}
      <section className="py-8 bg-muted">
        <div className="responsive-container">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start bg-transparent border-b mb-6">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6"
              >
                Reviews ({product.reviews})
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-6"
              >
                Shipping & Returns
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="p-6 bg-white rounded-lg">
              <h3 className="text-lg font-bold mb-4">Product Description</h3>
              <p className="text-gray-600 mb-4">{product.description}</p>

              <h4 className="text-md font-bold mb-2">Benefits:</h4>
              <ul className="list-disc list-inside space-y-1 mb-4">
                {product.benefits.map((benefit, index) => (
                  <li key={index} className="text-gray-600">
                    {benefit}
                  </li>
                ))}
              </ul>

              <h4 className="text-md font-bold mb-2">Usage Instructions:</h4>
              <p className="text-gray-600">
                Store in refrigerator. Wash thoroughly before use. Can be eaten raw or cooked according to recipe
                instructions.
              </p>
            </TabsContent>

            <TabsContent value="reviews" className="p-6 bg-white rounded-lg">
              <h3 className="text-lg font-bold mb-4">Customer Reviews</h3>
              <div className="flex items-center mb-6">
                <div className="mr-6">
                  <div className="text-5xl font-bold text-center">{product.rating.toFixed(1)}</div>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(product.rating) ? "star-filled" : "star-empty"}`}
                      />
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-1">{product.reviews} reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => (
                    <div key={star} className="flex items-center">
                      <div className="w-12">{star} star</div>
                      <div className="w-full mx-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 3 : 2}%`,
                          }}
                        ></div>
                      </div>
                      <div className="w-10 text-right text-sm text-gray-500">
                        {star === 5 ? 70 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 3 : 2}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="btn-primary">Write a Review</Button>
            </TabsContent>

            <TabsContent value="shipping" className="p-6 bg-white rounded-lg">
              <h3 className="text-lg font-bold mb-4">Shipping Information</h3>
              <p className="text-gray-600 mb-4">
                Free shipping for orders over #1000. Standard delivery takes 2-3 business days.
              </p>

              <h4 className="text-md font-bold mb-2">Returns Policy:</h4>
              <p className="text-gray-600">
                We accept returns within 30 days of delivery. Items must be unused and in their original packaging.
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-12">
        <div className="responsive-container">
          <h2 className="section-title mb-6">Related Products</h2>
          <div className="product-grid">
            {product.relatedProducts.map((relatedProduct, index) => (
              <SaleProductCard
                key={index}
                brand={relatedProduct.brand}
                name={relatedProduct.name}
                price={relatedProduct.price}
                originalPrice={relatedProduct.originalPrice}
                weight={relatedProduct.weight}
                discount={relatedProduct.discount}
                image={relatedProduct.image}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t bg-white py-6 sm:py-8">
        <div className="container mx-auto text-center px-4 sm:px-6 lg:px-8">
          <p className="text-gray-500 text-xs sm:text-sm">
            © 2025 Executive Tech. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

