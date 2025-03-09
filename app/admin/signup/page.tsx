"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { toast } from "sonner"
import { Eye, EyeOff, ShieldCheck, AlertTriangle, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { TrustSystem } from "@/lib/trust-system"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Updated schema for admin registration without domain or code restrictions
const adminSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters for admin accounts")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
})

export default function AdminSignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ipAddress, setIpAddress] = useState<string | null>(null)
  const [location, setLocation] = useState<string | null>(null)
  const router = useRouter()

  // Fetch IP info for logging purposes
  useEffect(() => {
    const getIpInfo = async () => {
      try {
        const res = await fetch("https://ipinfo.io/json?token=ce8a4cc390c905")
        const data = await res.json()
        setIpAddress(data.ip)
        setLocation(`${data.city}, ${data.region}, ${data.country}`)
      } catch (error) {
        console.error("Could not fetch IP info:", error)
      }
    }
    getIpInfo()
  }, [])

  // Calculate password strength for admin (more strict criteria)
  const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0
    let strength = 0
    // Length check
    if (password.length >= 12) strength += 20
    else if (password.length >= 8) strength += 10
    // Character types
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

  // Form validation
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}
    try {
      adminSchema.parse({ name, email, password })
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message
          }
        })
      }
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }
    // Check for existing email
    if (email && !newErrors.email) {
      try {
        const userQuery = query(collection(db, "users"), where("email", "==", email))
        const userDocs = await getDocs(userQuery)
        if (!userDocs.empty) {
          newErrors.email = "An account with this email already exists"
        }
      } catch (error) {
        console.error("Error checking email:", error)
        newErrors.email = "Error verifying email availability"
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle registration
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = await validateForm()
    if (!isValid) return

    setLoading(true)
    try {
      const result = await TrustSystem.registerUser({
        name,
        email,
        password,
        role: "admin",
      })

      if (result.success) {
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
      } else {
        toast.error("Registration failed", {
          description: result.error,
        })
      }
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message || "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-md">
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center">
              <div className="p-3 rounded-full bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">Admin Registration</CardTitle>
            <CardDescription>Create a new administrator account</CardDescription>
          </CardHeader>
 
          <div className="mx-6 mb-4 text-black">
            <Alert variant="destructive" className="text-black">
              <AlertTitle>Restricted Access</AlertTitle>
              <AlertDescription>
                Only authorized administrators may register. Unauthorized attempts will be logged.
              </AlertDescription>
            </Alert>
          </div>

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
                  placeholder="yourname@example.com"
                  className={errors.email ? "border-destructive" : ""}
                  required
                />
                {errors.email ? (
                  <p className="text-sm text-destructive">{errors.email}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Enter any valid email address
                  </p>
                )}
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
                      <li className={password.length >= 12 ? "text-green-500" : ""}>
                        • At least 12 characters
                      </li>
                      <li className={/[A-Z]/.test(password) ? "text-green-500" : ""}>
                        • One uppercase letter
                      </li>
                      <li className={/[a-z]/.test(password) ? "text-green-500" : ""}>
                        • One lowercase letter
                      </li>
                      <li className={/[0-9]/.test(password) ? "text-green-500" : ""}>
                        • One number
                      </li>
                      <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-500" : ""}>
                        • One special character
                      </li>
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
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>

              <Separator />
              
              {ipAddress && (
                <div className="text-xs text-muted-foreground">
                  <p>Registration attempt from: {ipAddress}</p>
                  {location && <p>Location: {location}</p>}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 mt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2">Creating account...</span>
                    <div className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
                  </>
                ) : (
                  "Create Admin Account"
                )}
              </Button>
              <p className="text-center text-sm">
                Already have an admin account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
