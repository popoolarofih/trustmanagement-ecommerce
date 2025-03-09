"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast, Toaster } from "sonner"
import { Eye, EyeOff, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, addDoc, collection } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { z } from "zod"
import { userSchema } from "@/lib/trust-system"

export default function AdminSignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault()

    // Validate inputs using Zod schema
    try {
      userSchema.parse({ name, email, password, role: "admin" })
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error("Validation error", {
          description: error.errors.map((err) => err.message).join(", "),
        })
      }
      return
    }

    setIsSubmitting(true)

    try {
      // Create admin user using Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Save admin details in Firestore with role "admin"
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: "admin",
        createdAt: new Date().toISOString(),
        trustScore: 5, // default initial trust score
      })

      // Log security event in Firestore without IP/location info
      await addDoc(collection(db, "securityLogs"), {
        userId: user.uid,
        event: "admin_account_created",
        name,
        email,
        timestamp: new Date().toISOString(),
      })

      toast.success("Admin account created", {
        description: "Your admin account has been created successfully. Please verify your email.",
      })

      // Redirect to admin dashboard
      router.push("/admin/dashboard")
    } catch (error: any) {
      toast.error("Admin account creation failed", {
        description: error.message || "An unexpected error occurred.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      {/* Toast Component */}
      <Toaster position="top-right" />

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
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
