"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Truck, CheckCircle } from "lucide-react";
import Image from "next/image";

// Define types for order items and order
interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  status: string;
  createdAt: Date;
  items: OrderItem[];
  totalAmount: number;
  vendorName: string;
  vendorTrustScore?: number;
  shippingAddress: string;
  paymentMethod: "credit_card" | "paypal" | "cash_on_delivery";
}

export default function OrderDetailsPage() {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { id } = useParams() as { id: string };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      const user = auth.currentUser;
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const orderDoc = await getDoc(doc(db, "orders", id));
        if (!orderDoc.exists()) {
          router.push("/account/orders");
          return;
        }

        const orderData = orderDoc.data();
        if (!orderData) {
          router.push("/account/orders");
          return;
        }

        // Check if this order belongs to the current user
        if (orderData.customerId !== user.uid) {
          router.push("/account/orders");
          return;
        }

        setOrder({
          id: orderDoc.id,
          status: orderData.status,
          createdAt: orderData.createdAt?.toDate ? orderData.createdAt.toDate() : new Date(),
          items: orderData.items,
          totalAmount: orderData.totalAmount,
          vendorName: orderData.vendorName,
          vendorTrustScore: orderData.vendorTrustScore,
          shippingAddress: orderData.shippingAddress,
          paymentMethod: orderData.paymentMethod,
        });
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, router]);

  const getOrderStatusSteps = () => {
    const steps = [
      { id: "pending", label: "Order Placed", icon: Package, completed: true },
      {
        id: "processing",
        label: "Processing",
        icon: Package,
        completed: order ? ["processing", "shipped", "delivered"].includes(order.status) : false,
      },
      {
        id: "shipped",
        label: "Shipped",
        icon: Truck,
        completed: order ? ["shipped", "delivered"].includes(order.status) : false,
      },
      {
        id: "delivered",
        label: "Delivered",
        icon: CheckCircle,
        completed: order ? order.status === "delivered" : false,
      },
    ];
    return steps;
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/account/orders")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground">
            Placed on {order.createdAt.toLocaleDateString()} at {order.createdAt.toLocaleTimeString()}
          </p>
        </div>
        <Badge
          variant={
            order.status === "delivered"
              ? "secondary"
              : order.status === "processing"
              ? "outline"
              : "default"
          }
          className="mt-2 md:mt-0"
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative flex justify-between">
                {getOrderStatusSteps().map((step) => (
                  <div key={step.id} className="flex flex-col items-center">
                    <div
                      className={`rounded-full p-2 ${
                        step.completed ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm mt-2">{step.label}</span>
                  </div>
                ))}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10"></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded overflow-hidden">
                      <Image
                        src={item.imageUrl || "/placeholder.svg?height=64&width=64"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${(order.totalAmount * 0.08).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${(order.totalAmount + order.totalAmount * 0.08).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">{order.vendorName}</h3>
                {order.vendorTrustScore !== undefined && (
                  <div className="flex items-center mt-1">
                    <ShieldCheck className="h-4 w-4 mr-1 text-primary" />
                    <span className="text-sm">Trust Score: {order.vendorTrustScore}/5</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{order.shippingAddress}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                {order.paymentMethod === "credit_card"
                  ? "Credit Card"
                  : order.paymentMethod === "paypal"
                  ? "PayPal"
                  : "Cash on Delivery"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
