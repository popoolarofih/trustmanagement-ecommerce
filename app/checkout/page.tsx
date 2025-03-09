"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, addDoc, writeBatch, serverTimestamp } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useCart } from "@/hooks/use-cart.client"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, ShieldCheck, TruckIcon } from "lucide-react"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [vendorTrustScores, setVendorTrustScores] = useState<{ [key: string]: number }>({})
  const [shippingAddress, setShippingAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
//   const { toast } = useToast()

  // Group items by vendor
  const itemsByVendor = items.reduce(
    (acc, item) => {
      if (!acc[item.vendorId]) {
        acc[item.vendorId] = {
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          items: [],
          totalAmount: 0,
        }
      }

      acc[item.vendorId].items.push(item)
      acc[item.vendorId].totalAmount += item.price * item.quantity

      return acc
    },
    {} as { [key: string]: any },
  )

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = auth.currentUser

      if (!currentUser) {
        toast({
          title: "Login required",
          description: "Please login to proceed with checkout",
          variant: "destructive",
        })
        router.push("/login?redirect=checkout")
        return
      }

      // Get user data
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists()) {
          setUser(userDoc.data())
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }

      // Fetch vendor trust scores
      try {
        const vendorIds = Object.keys(itemsByVendor)
        const trustScores: { [key: string]: number } = {}

        for (const vendorId of vendorIds) {
          const vendorDoc = await getDoc(doc(db, "users", vendorId))
          if (vendorDoc.exists()) {
            trustScores[vendorId] = vendorDoc.data().trustScore || 3
          }
        }

        setVendorTrustScores(trustScores)
      } catch (error) {
        console.error("Error fetching vendor trust scores:", error)
      } finally {
        setLoading(false)
      }
    }

    if (items.length === 0) {
      router.push("/cart")
    } else {
      checkAuth()
    }
  }, [items.length, router, toast, itemsByVendor])

  const getTrustBadgeVariant = (score: number) => {
    if (score >= 4.5) return "success"
    if (score >= 3.5) return "default"
    if (score >= 2.5) return "warning"
    return "destructive"
  }

  const getTrustLabel = (score: number) => {
    if (score >= 4.5) return "Highly Trusted"
    if (score >= 3.5) return "Trusted"
    if (score >= 2.5) return "Moderate Trust"
    return "Low Trust"
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shippingAddress) {
      toast({
        title: "Missing information",
        description: "Please provide a shipping address",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      const batch = writeBatch(db)
      const currentUser = auth.currentUser

      if (!currentUser) {
        throw new Error("User not authenticated")
      }

      // Create orders for each vendor
      const orderPromises = Object.values(itemsByVendor).map(async (vendorOrder: any) => {
        // Create order document
        const orderRef = await addDoc(collection(db, "orders"), {
          customerId: currentUser.uid,
          customerName: user?.name || currentUser.email,
          customerEmail: currentUser.email,
          vendorId: vendorOrder.vendorId,
          vendorName: vendorOrder.vendorName,
          items: vendorOrder.items.map((item: any) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          })),
          totalAmount: vendorOrder.totalAmount,
          shippingAddress,
          paymentMethod,
          status: "pending",
          createdAt: serverTimestamp(),
          // Trust management: Record the vendor's trust score at time of purchase
          vendorTrustScore: vendorTrustScores[vendorOrder.vendorId] || 3,
        })

        // Create customer review opportunity
        await addDoc(collection(db, "reviewOpportunities"), {
          orderId: orderRef.id,
          customerId: currentUser.uid,
          vendorId: vendorOrder.vendorId,
          createdAt: serverTimestamp(),
          completed: false,
        })

        return orderRef.id
      })

      await Promise.all(orderPromises)

      // Commit the batch
      await batch.commit()

      toast({
        title: "Order placed successfully",
        description: "Thank you for your purchase!",
        variant: "default",
      })

      // Clear cart and redirect to order confirmation
      clearCart()
      router.push("/order-confirmation")
    } catch (error: any) {
      console.error("Error placing order:", error)
      toast({
        title: "Failed to place order",
        description: error.message || "An error occurred while processing your order",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmitOrder}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
                <CardDescription>Enter your shipping details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Shipping Address</Label>
                  <Textarea
                    id="address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter your full address"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Select your preferred payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2 py-2">
                    <RadioGroupItem value="credit_card" id="credit_card" />
                    <Label htmlFor="credit_card">Credit Card</Label>
                  </div>
                  <div className="flex items-center space-x-2 py-2">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal">PayPal</Label>
                  </div>
                  <div className="flex items-center space-x-2 py-2">
                    <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                    <Label htmlFor="cash_on_delivery">Cash on Delivery</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.values(itemsByVendor).map((vendorOrder: any, index) => (
                  <div key={vendorOrder.vendorId} className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{vendorOrder.vendorName}</h3>
                      <Badge variant={getTrustBadgeVariant(vendorTrustScores[vendorOrder.vendorId] || 3)}>
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        {getTrustLabel(vendorTrustScores[vendorOrder.vendorId] || 3)} (
                        {vendorTrustScores[vendorOrder.vendorId] || 3}/5)
                      </Badge>
                    </div>

                    {vendorTrustScores[vendorOrder.vendorId] < 3 && (
                      <Alert variant="warning" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Low Trust Score Warning</AlertTitle>
                        <AlertDescription>
                          This vendor has a below-average trust score. Consider reviewing their products carefully.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendorOrder.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12 rounded overflow-hidden">
                                  <Image
                                    src={item.imageUrl || "/placeholder.svg?height=48&width=48"}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <span>{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${(item.price * item.quantity).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="flex justify-between mt-2 font-medium">
                      <span>Vendor Subtotal:</span>
                      <span>${vendorOrder.totalAmount.toFixed(2)}</span>
                    </div>

                    {index < Object.values(itemsByVendor).length - 1 && <Separator className="my-6" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={processing}>
                {processing ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </form>
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${(totalPrice * 0.08).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${(totalPrice + totalPrice * 0.08).toFixed(2)}</span>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TruckIcon className="h-4 w-4" />
                  <span>Free shipping on orders over $50</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Trust-based vendor verification</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

