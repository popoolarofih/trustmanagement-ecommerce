"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrustSystem } from "@/lib/trust"

export default function AdminSignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  // const { toast } = useToast()

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()

    setIsSubmitting(true)

    try {
      const ipAddress = await TrustSystem.getUserIPAddress()
      const location = await TrustSystem.getUserLocation()

      const result = await TrustSystem.createAdminAccount(name, email, password)

      if (result.success && result.user) {
        // Log security event for audit trail
        await TrustSystem.logSecurityEvent(result.user.uid, "admin_account_created", {
          name,
          email,
          ipAddress,
          location,
          timestamp: new Date().toISOString(),
        })

        toast.success("Admin account created", {
          description: "Your admin account has been created successfully. Please verify your email.",
        })

        // Redirect to admin dashboard
        router.push("/admin/dashboard")
      } else if (result.success) {
        // Handle the case where registration succeeded but user object is undefined
        toast.success("Admin account created", {
          description: "Your admin account has been created successfully. Please verify your email.",
        })

        router.push("/admin/dashboard")
      } else {
        toast.error("Admin account creation failed", {
          description: result.error || "An unexpected error occurred.",
        })
      }
    } catch (error: any) {
      toast.error("An error occurred during signup", {
        description: error.message || "Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Signup</CardTitle>
          <CardDescription>Create a new admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


