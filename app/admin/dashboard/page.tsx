"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import AdminLayout from "@/components/layouts/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, ShoppingCart, Package, Users } from "lucide-react"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [vendors, setVendors] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
//   const { toast } = useToast()

  useEffect(() => {
    // Check if user is admin
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login")
        return
      }

      // Fetch dashboard data
      fetchDashboardData()
    })

    return () => unsubscribe()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      // Fetch vendors
      const vendorsSnapshot = await getDocs(collection(db, "users"))
      const vendorsData = vendorsSnapshot.docs
        .filter((doc) => doc.data().role === "vendor")
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      setVendors(vendorsData)

      // Fetch recent orders
      const ordersSnapshot = await getDocs(collection(db, "orders"))
      const ordersData = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setOrders(ordersData.slice(0, 5)) // Get last 5 orders
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateVendorTrust = async (vendorId: string, newScore: number) => {
    try {
      await updateDoc(doc(db, "users", vendorId), {
        trustScore: newScore,
      })

      // Update local state
      setVendors(vendors.map((vendor) => (vendor.id === vendorId ? { ...vendor, trustScore: newScore } : vendor)))

      toast({
        title: "Trust score updated",
        description: "Vendor trust score has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update vendor trust score.",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminLayout>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,431</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Vendors Trust Management</h2>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>{vendor.name}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={vendor.trustScore >= 4 ? "success" : vendor.trustScore >= 2 ? "warning" : "destructive"}
                    >
                      {vendor.trustScore}/5
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateVendorTrust(vendor.id, Math.max(1, vendor.trustScore - 1))}
                      disabled={vendor.trustScore <= 1}
                    >
                      -
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateVendorTrust(vendor.id, Math.min(5, vendor.trustScore + 1))}
                      disabled={vendor.trustScore >= 5}
                    >
                      +
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                  <TableCell>{order.id.slice(0, 8)}</TableCell>
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
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  )
}

