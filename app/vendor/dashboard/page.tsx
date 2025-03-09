"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, addDoc } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { db, auth, storage } from "@/lib/firebase"
import VendorLayout from "@/components/layouts/vendor-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingBag, DollarSign, Package } from "lucide-react"
import { toast } from "sonner"

export default function VendorDashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [vendorData, setVendorData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openAddProductDialog, setOpenAddProductDialog] = useState(false)

  // New product form state
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productCategory, setProductCategory] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productImage, setProductImage] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  // const { toast } = useToast()

  useEffect(() => {
    // Check if user is a vendor
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login")
        return
      }

      try {
        // Get vendor data
        const vendorDoc = await getDocs(
          query(collection(db, "users"), where("email", "==", user.email), where("role", "==", "vendor")),
        )

        if (vendorDoc.empty) {
          router.push("/")
          return
        }

        const vendorData = {
          id: vendorDoc.docs[0].id,
          ...vendorDoc.docs[0].data(),
        }
        setVendorData(vendorData)

        // Fetch vendor's products
        const productsSnapshot = await getDocs(
          query(collection(db, "products"), where("vendorId", "==", vendorDoc.docs[0].id)),
        )

        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setProducts(productsData)

        // Fetch vendor's orders
        const ordersSnapshot = await getDocs(
          query(collection(db, "orders"), where("vendorId", "==", vendorDoc.docs[0].id)),
        )

        const ordersData = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setOrders(ordersData)
      } catch (error) {
        console.error("Error fetching vendor data:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productName || !productPrice || !productCategory || !productDescription) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let imageUrl = ""

      // Upload image if provided
      if (productImage) {
        const storageRef = ref(storage, `products/${Date.now()}_${productImage.name}`)
        const uploadTask = uploadBytesResumable(storageRef, productImage)

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              setUploadProgress(progress)
            },
            (error) => {
              reject(error)
            },
            async () => {
              imageUrl = await getDownloadURL(uploadTask.snapshot.ref)
              resolve()
            },
          )
        })
      }

      // Add product to Firestore
      await addDoc(collection(db, "products"), {
        name: productName,
        price: Number.parseFloat(productPrice),
        category: productCategory,
        description: productDescription,
        imageUrl,
        vendorId: vendorData.id,
        vendorName: vendorData.name,
        createdAt: new Date().toISOString(),
        inStock: true,
      })

      toast({
        title: "Product added",
        description: "Your product has been added successfully.",
      })

      // Reset form
      setProductName("")
      setProductPrice("")
      setProductCategory("")
      setProductDescription("")
      setProductImage(null)
      setUploadProgress(0)
      setOpenAddProductDialog(false)

      // Refresh products list
      const productsSnapshot = await getDocs(query(collection(db, "products"), where("vendorId", "==", vendorData.id)))

      const productsData = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setProducts(productsData)
    } catch (error) {
      toast({
        title: "Failed to add product",
        description: "An error occurred while adding the product.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductImage(e.target.files[0])
    }
  }

  if (loading) {
    return (
      <VendorLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Dialog open={openAddProductDialog} onOpenChange={setOpenAddProductDialog}>
            <DialogTrigger asChild>
              <Button>Add New Product</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Fill in the product details below to add a new product to your inventory.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="productPrice">Price ($)</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="productCategory">Category</Label>
                    <Select value={productCategory} onValueChange={setProductCategory} required>
                      <SelectTrigger id="productCategory">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fruits">Fruits</SelectItem>
                        <SelectItem value="vegetables">Vegetables</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="meat">Meat</SelectItem>
                        <SelectItem value="bakery">Bakery</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                        <SelectItem value="snacks">Snacks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="productDescription">Description</Label>
                    <Textarea
                      id="productDescription"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="productImage">Product Image</Label>
                    <Input id="productImage" type="file" accept="image/*" onChange={handleImageChange} />
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trust Score</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendorData?.trustScore}/5</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Your Products</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={product.inStock ? "success" : "destructive"}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No products found. Add your first product!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <h2 className="text-xl font-bold mt-8 mb-4">Recent Orders</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status === "delivered" ? "success" : order.status === "processing" ? "warning" : "default"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </VendorLayout>
  )
}

