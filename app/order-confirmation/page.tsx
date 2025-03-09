"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ShoppingBag } from "lucide-react"

export default function OrderConfirmationPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user came from checkout
    const referrer = document.referrer
    if (!referrer.includes("/checkout")) {
      router.push("/")
    }
  }, [router])

  return (
    <div className="container max-w-2xl mx-auto px-4 py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
          <CardDescription>Thank you for your purchase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Your order has been placed successfully. You will receive an email confirmation shortly.</p>
          <p>
            After receiving your order, you'll have the opportunity to rate your experience with each vendor, which
            helps maintain our trust management system.
          </p>
          <div className="bg-muted p-4 rounded-lg mt-6">
            <h3 className="font-medium mb-2">Trust Management System</h3>
            <p className="text-sm text-muted-foreground">
              Our trust management system helps ensure quality service from all vendors. Your feedback after receiving
              your order will help other customers make informed decisions.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push("/")}>
            Continue Shopping
          </Button>
          <Button onClick={() => router.push("/account/orders")}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            View Orders
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

