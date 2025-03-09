"use client"

import { Label } from "@/components/ui/label"
import { useEffect, useState } from "react"
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Product } from "@/lib/types"
import ProductCard from "@/components/product-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ShieldCheck, Search, Filter, X, ShoppingBag, Star } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { toast } from "sonner"

// Number of products to load per page
const PRODUCTS_PER_PAGE = 12

export default function ProductsPage() {
  const { user, userData } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [category, setCategory] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [sortBy, setSortBy] = useState<string>("newest")
  const [trustFilter, setTrustFilter] = useState<number>(0) // 0 means no filter
  const [inStockOnly, setInStockOnly] = useState<boolean>(false)
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false)

  // Available categories
  const categories = ["all", "fruits", "vegetables", "dairy", "meat", "bakery", "beverages", "snacks"]

  // Initial product load
  useEffect(() => {
    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sortBy, trustFilter, inStockOnly, onSaleOnly])

  // Search effect with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchProducts()
      } else {
        fetchProducts()
      }
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, priceRange])

  // Fetch products with filters
  const fetchProducts = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setProducts([])
      }

      // Start building the query
      const productsQuery = collection(db, "products")
      const constraints = []

      // Apply category filter
      if (category !== "all") {
        constraints.push(where("category", "==", category))
      }

      // Apply in-stock filter
      if (inStockOnly) {
        constraints.push(where("inStock", "==", true))
      }

      // Apply on-sale filter
      // Note: Firestore doesn't support inequality on different fields. This is a placeholder.
      if (onSaleOnly) {
        // This filter might need adjustment depending on your schema
        constraints.push(where("onSale", "==", true))
      }

      // Apply trust score filter
      if (trustFilter > 0) {
        constraints.push(where("trustScore", ">=", trustFilter))
      }

      // Apply price range filter
      constraints.push(where("price", ">=", priceRange[0]))
      constraints.push(where("price", "<=", priceRange[1]))

      // Apply sorting
      let sortField = "createdAt"
      let sortDirection: "asc" | "desc" = "desc"

      switch (sortBy) {
        case "newest":
          sortField = "createdAt"
          sortDirection = "desc"
          break
        case "oldest":
          sortField = "createdAt"
          sortDirection = "asc"
          break
        case "price-low":
          sortField = "price"
          sortDirection = "asc"
          break
        case "price-high":
          sortField = "price"
          sortDirection = "desc"
          break
        case "name-asc":
          sortField = "name"
          sortDirection = "asc"
          break
        case "name-desc":
          sortField = "name"
          sortDirection = "desc"
          break
        case "trust-high":
          sortField = "trustScore"
          sortDirection = "desc"
          break
      }

      // Build the query with all constraints
      let finalQuery = query(
        productsQuery,
        ...constraints,
        orderBy(sortField, sortDirection),
        limit(PRODUCTS_PER_PAGE)
      )

      // If loading more, start after the last visible document
      if (isLoadMore && lastVisible) {
        finalQuery = query(
          productsQuery,
          ...constraints,
          orderBy(sortField, sortDirection),
          startAfter(lastVisible),
          limit(PRODUCTS_PER_PAGE)
        )
      }

      const querySnapshot = await getDocs(finalQuery)

      // Update last visible for pagination
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1]
      setLastVisible(lastVisibleDoc || null)

      // Check if there are more products to load
      setHasMore(querySnapshot.docs.length === PRODUCTS_PER_PAGE)

      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]

      if (isLoadMore) {
        setProducts((prev) => [...prev, ...productsData])
      } else {
        setProducts(productsData)
      }
    } catch (error: any) {
      console.error("Error fetching products:", error)
      toast.error("Error fetching products", {
        description: error.message || "An unexpected error occurred while fetching products.",
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Search products
  const searchProducts = async () => {
    setLoading(true)
    setProducts([])

    try {
      // In a real app, you'd use a search service like Algolia.
      // For this demo, we'll do a simple client-side search.
      const productsQuery = query(
        collection(db, "products"),
        orderBy("name"),
        limit(100) // Get a larger batch for client-side filtering
      )

      const querySnapshot = await getDocs(productsQuery)

      let productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]

      // Client-side filtering
      productsData = productsData.filter((product) => {
        // Search term filter
        const matchesSearch =
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase())

        // Category filter
        const matchesCategory = category === "all" || product.category === category

        // Price range filter
        const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1]

        // In-stock filter
        const matchesStock = inStockOnly ? product.inStock : true

        // On-sale filter
        const matchesSale = onSaleOnly ? product.originalPrice && product.price < product.originalPrice : true

        // Trust score filter
        const matchesTrust = trustFilter > 0 ? product.trustScore && product.trustScore >= trustFilter : true

        return matchesSearch && matchesCategory && matchesPrice && matchesStock && matchesSale && matchesTrust
      })

      // Apply sorting
      productsData.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case "oldest":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          case "price-low":
            return a.price - b.price
          case "price-high":
            return b.price - a.price
          case "name-asc":
            return a.name.localeCompare(b.name)
          case "name-desc":
            return b.name.localeCompare(a.name)
          case "trust-high":
            return (b.trustScore || 0) - (a.trustScore || 0)
          default:
            return 0
        }
      })

      // Limit to first page
      setProducts(productsData.slice(0, PRODUCTS_PER_PAGE))
      setHasMore(productsData.length > PRODUCTS_PER_PAGE)
    } catch (error: any) {
      console.error("Error searching products:", error)
      toast.error("Error searching products", {
        description: error.message || "An unexpected error occurred while searching products.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load more products
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(true)
    }
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setCategory("all")
    setPriceRange([0, 100])
    setSortBy("newest")
    setTrustFilter(0)
    setInStockOnly(false)
    setOnSaleOnly(false)
  }

  // Get trust badge variant
  const getTrustBadgeVariant = (score: number) => {
    if (score >= 4.5) return "success"
    if (score >= 3.5) return "default"
    if (score >= 2.5) return "warning"
    return "destructive"
  }

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(PRODUCTS_PER_PAGE)
      .fill(0)
      .map((_, index) => (
        <div key={index} className="border rounded-lg p-4 h-[300px]">
          <div className="relative h-40 w-full mb-3">
            <Skeleton className="h-full w-full" />
          </div>
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/4 mb-4" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      ))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Products</h1>
          <p className="text-muted-foreground">Browse our selection of fresh groceries</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {(category !== "all" ||
                  trustFilter > 0 ||
                  inStockOnly ||
                  onSaleOnly ||
                  sortBy !== "newest" ||
                  priceRange[0] > 0 ||
                  priceRange[1] < 100) && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                    {
                      [
                        category !== "all",
                        trustFilter > 0,
                        inStockOnly,
                        onSaleOnly,
                        sortBy !== "newest",
                        priceRange[0] > 0 || priceRange[1] < 100,
                      ].filter(Boolean).length
                    }
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filter Products</SheetTitle>
                <SheetDescription>Refine your product search with these filters</SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Applied Filters</h3>
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8">
                    Reset All
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base">Price Range</Label>
                    <div className="mt-6 px-2">
                      <Slider
                        defaultValue={[0, 100]}
                        value={priceRange}
                        onValueChange={(value) => setPriceRange(value as [number, number])}
                        min={0}
                        max={100}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between mt-2 text-sm">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base">Sort By</Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="name-asc">Name: A to Z</SelectItem>
                        <SelectItem value="name-desc">Name: Z to A</SelectItem>
                        <SelectItem value="trust-high">Trust Score: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base">Trust Score</Label>
                    <Select
                      value={trustFilter.toString()}
                      onValueChange={(value) => setTrustFilter(Number.parseInt(value))}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Filter by trust score" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">All Vendors</SelectItem>
                        <SelectItem value="3">3+ Stars</SelectItem>
                        <SelectItem value="4">4+ Stars</SelectItem>
                        <SelectItem value="4.5">4.5+ Stars</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="in-stock"
                        checked={inStockOnly}
                        onCheckedChange={(checked) => setInStockOnly(checked as boolean)}
                      />
                      <label
                        htmlFor="in-stock"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        In Stock Only
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="on-sale"
                        checked={onSaleOnly}
                        onCheckedChange={(checked) => setOnSaleOnly(checked as boolean)}
                      />
                      <label
                        htmlFor="on-sale"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        On Sale Only
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters display */}
      {(category !== "all" ||
        trustFilter > 0 ||
        inStockOnly ||
        onSaleOnly ||
        searchTerm ||
        priceRange[0] > 0 ||
        priceRange[1] < 100) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category !== "all" && (
            <Badge variant="secondary" className="px-3 py-1">
              Category: {category.charAt(0).toUpperCase() + category.slice(1)}
              <button className="ml-2" onClick={() => setCategory("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {trustFilter > 0 && (
            <Badge variant="secondary" className="px-3 py-1">
              Trust: {trustFilter}+ <Star className="h-3 w-3 ml-1 fill-current" />
              <button className="ml-2" onClick={() => setTrustFilter(0)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {inStockOnly && (
            <Badge variant="secondary" className="px-3 py-1">
              In Stock
              <button className="ml-2" onClick={() => setInStockOnly(false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {onSaleOnly && (
            <Badge variant="secondary" className="px-3 py-1">
              On Sale
              <button className="ml-2" onClick={() => setOnSaleOnly(false)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(priceRange[0] > 0 || priceRange[1] < 100) && (
            <Badge variant="secondary" className="px-3 py-1">
              Price: ${priceRange[0]} - ${priceRange[1]}
              <button className="ml-2" onClick={() => setPriceRange([0, 100])}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {searchTerm && (
            <Badge variant="secondary" className="px-3 py-1">
              Search: {searchTerm}
              <button className="ml-2" onClick={() => setSearchTerm("")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8">
            Clear All
          </Button>
        </div>
      )}

      {/* Trust system explanation for new users */}
      {user && userData && (
        <Alert className="mb-6 bg-accent/50 border-accent">
          <ShieldCheck className="h-5 w-5" />
          <AlertTitle>Trust System Active</AlertTitle>
          <AlertDescription>
            Our trust system helps you identify reliable vendors. Look for the trust score badge on products.
            {userData.trustScore < 3 &&
              " Your trust score will increase as you complete purchases and leave reviews."}
          </AlertDescription>
        </Alert>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {renderSkeletons()}
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline" className="gap-2">
                {loadingMore ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>Load More Products</>
                )}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No products found</CardTitle>
            <CardDescription>
              Try adjusting your filters or search terms to find what you're looking for.
            </CardDescription>
            <Button variant="outline" onClick={resetFilters} className="mt-4">
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
