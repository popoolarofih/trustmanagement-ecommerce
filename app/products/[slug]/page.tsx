"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, updateDoc, getDoc, addDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast, Toaster } from "sonner"
import { Star, ShieldCheck } from "lucide-react"

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [reviewText, setReviewText] = useState("")
  const [vendorRating, setVendorRating] = useState(5)
  const [openReviewDialog, setOpenReviewDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchOrders = async () => {
      const user = auth.currentUser
      if (!user) {
        router.push("/login")
        return
      }
      try {
        const ordersQuery = query(collection(db, "orders"), where("customerId", "==", user.uid))
        const ordersSnapshot = await getDocs(ordersQuery)
        const ordersData = ordersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        }))
        // Sort by date (newest first)
        ordersData.sort((a, b) => b.createdAt - a.createdAt)
        setOrders(ordersData)
      } catch (error: any) {
        console.error("Error fetching orders:", error)
        toast.error("Error fetching orders", {
          description: error.message || "An unexpected error occurred while fetching orders.",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [router])

  const handleOpenReview = (order: any) => {
    setSelectedOrder(order)
    setReviewText("")
    setVendorRating(5)
    setOpenReviewDialog(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedOrder || !reviewText) return

    try {
      const user = auth.currentUser
      if (!user) return

      // Get current vendor data
      const vendorDoc = await getDoc(doc(db, "users", selectedOrder.vendorId))
      const vendorData = vendorDoc.data()
      if (!vendorData) {
        throw new Error("Vendor data not found")
      }

      // Calculate new trust score (weighted average)
      const currentScore = vendorData.trustScore || 3
      const reviewCount = vendorData.reviewCount || 0
      const newReviewCount = reviewCount + 1
      const newTrustScore = reviewCount === 0 ? vendorRating : currentScore * 0.7 + vendorRating * 0.3

      // Update vendor trust score
      await updateDoc(doc(db, "users", selectedOrder.vendorId), {
        trustScore: Math.round(newTrustScore * 10) / 10,
        reviewCount: newReviewCount,
      })

      // Add review to database
      await addDoc(collection(db, "reviews"), {
        orderId: selectedOrder.id,
        vendorId: selectedOrder.vendorId,
        customerId: user.uid,
        rating: vendorRating,
        review: reviewText,
        createdAt: new Date().toISOString(),
      })

      // Update order to mark as reviewed
      await updateDoc(doc(db, "orders", selectedOrder.id), {
        reviewed: true,
      })

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === selectedOrder.id ? { ...order, reviewed: true } : order
        )
      )

      toast.success("Review submitted", {
        description:
          "Thank you for your feedback! Your review helps maintain our trust system.",
      })

      setOpenReviewDialog(false)
    } catch (error: any) {
      toast.error("Error submitting review", {
        description: error.message || "An error occurred while submitting your review.",
      })
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
      {/* Toast Component */}
      <Toaster position="top-right" />

      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{order.vendorName}</span>
                        {order.vendorTrustScore && (
                          <Badge variant="outline" className="mt-1 w-fit">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Trust: {order.vendorTrustScore}/5
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>${order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : order.status === "processing"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/account/orders/${order.id}`)}>
                          Details
                        </Button>
                        {order.status === "delivered" && !order.reviewed && (
                          <Button size="sm" onClick={() => handleOpenReview(order)}>
                            Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Orders Yet</CardTitle>
            <CardDescription>You haven't placed any orders yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")}>Start Shopping</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={openReviewDialog} onOpenChange={setOpenReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Your Experience</DialogTitle>
            <DialogDescription>
              Your feedback helps maintain our trust management system and improves the experience for all users.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-base">Vendor: {selectedOrder?.vendorName}</Label>
              <p className="text-sm text-muted-foreground">Order #{selectedOrder?.id.slice(0, 8)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rate the vendor (1-5 stars)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    variant={vendorRating >= star ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setVendorRating(star)}
                  >
                    <Star className={`h-5 w-5 ${vendorRating >= star ? "fill-current" : ""}`} />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review">Your Review</Label>
              <Textarea
                id="review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this vendor..."
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview} disabled={!reviewText}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
