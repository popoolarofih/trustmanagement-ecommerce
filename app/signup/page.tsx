"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { toast, Toaster } from "sonner"
import { Eye, EyeOff, ShieldCheck, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/hooks/use-auth"
import { userSchema } from "@/lib/trust-system"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState("customer")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { register } = useAuth()

  // Calculate password strength
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0
    let strength = 0
    // Length check
    if (password.length >= 8) strength += 20
    // Character type checks
    if (/[A-Z]/.test(password)) strength += 20
    if (/[a-z]/.test(password)) strength += 20
    if (/[0-9]/.test(password)) strength += 20
    if (/[^A-Za-z0-9]/.test(password)) strength += 20
    return strength
  }

  const passwordStrength = calculatePasswordStrength(password)
  const getPasswordStrengthText = () => {
    if (passwordStrength <= 20) return "Very weak"
    if (passwordStrength <= 40) return "Weak"
    if (passwordStrength <= 60) return "Medium"
    if (passwordStrength <= 80) return "Strong"
    return "Very strong"
  }
  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 20) return "bg-destructive"
    if (passwordStrength <= 40) return "bg-destructive/80"
    if (passwordStrength <= 60) return "bg-orange-500"
    if (passwordStrength <= 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    try {
      userSchema.parse({ name, email, password, role })
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message
          }
        })
      }
    }
    // Check if passwords match
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      const result = await register({
        name,
        email,
        password,
        role,
      })
      if (result.success) {
        toast.success("Account created successfully", {
          description: "Your account has been created. Welcome!",
        })
      } else {
        toast.error("Account creation failed", {
          description: result.error || "Please try again.",
        })
      }
    } catch (error: any) {
      toast.error("Account creation failed", {
        description: error.message || "An unexpected error occurred.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-muted/30">
      {/* Toast Component */}
      <Toaster position="top-right" />

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-2xl">Create Account</CardTitle>
          </div>
          <CardDescription>Sign up to start shopping securely</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={errors.name ? "border-destructive" : ""}
                required
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className={errors.email ? "border-destructive" : ""}
                required
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? "border-destructive pr-10" : "pr-10"}
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
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              {password && (
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Password strength: {getPasswordStrengthText()}</span>
                    <span className="text-xs">{passwordStrength}%</span>
                  </div>
                  <Progress value={passwordStrength} className={getPasswordStrengthColor()} />
                  <ul className="text-xs text-muted-foreground space-y-1 mt-2">
                    <li className={password.length >= 8 ? "text-green-500" : ""}>• At least 8 characters</li>
                    <li className={/[A-Z]/.test(password) ? "text-green-500" : ""}>• At least one uppercase letter</li>
                    <li className={/[a-z]/.test(password) ? "text-green-500" : ""}>• At least one lowercase letter</li>
                    <li className={/[0-9]/.test(password) ? "text-green-500" : ""}>• At least one number</li>
                    <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-500" : ""}>• At least one special character</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={errors.confirmPassword ? "border-destructive" : ""}
                required
              />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <RadioGroup value={role} onValueChange={setRole} className="flex">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="customer" id="customer" />
                  <Label htmlFor="customer">Customer</Label>
                  <Info className="h-4 w-4 text-muted-foreground ml-1" />
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vendor" id="vendor" />
                  <Label htmlFor="vendor">Vendor</Label>
                  <Info className="h-4 w-4 text-muted-foreground ml-1" />
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 mt-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
