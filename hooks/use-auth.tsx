"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { type User, onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useRouter, usePathname } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { CartProvider } from "@/hooks/use-cart.client"
import { TrustSystem, type UserData } from "@/lib/trust-system"
import { toast } from "sonner"

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  isAdmin: boolean
  isVendor: boolean
  isCustomer: boolean
  trustScore: number
  hasPermission: (permission: string) => Promise<boolean>
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: any) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<{ success: boolean; error?: string }>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
  isVendor: false,
  isCustomer: false,
  trustScore: 0,
  hasPermission: async () => false,
  login: async () => ({ success: false, error: "Not implemented" }),
  register: async () => ({ success: false, error: "Not implemented" }),
  logout: async () => ({ success: false, error: "Not implemented" }),
  refreshUserData: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Fetch user data from Firestore
  const fetchUserData = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (userDoc.exists()) {
        const data = userDoc.data() as Omit<UserData, "id">
        setUserData({ ...data, id: user.uid })
      } else {
        console.error("No user data found in Firestore")
        setUserData(null)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      setUserData(null)
    }
  }

  // Refresh user data (useful after profile updates)
  const refreshUserData = async () => {
    if (user) {
      await fetchUserData(user)
    }
  }

  // Handle login
  const login = async (email: string, password: string) => {
    try {
      const result = await TrustSystem.loginUser({ email, password })

      if (result.success) {
        // Redirect to products page after successful login
        router.push("/products")

        toast.success("Login successful", {
          description: "Welcome back!",
        })
      } else {
        toast.error("Login failed", {
          description: result.error,
        })
      }

      return result
    } catch (error: any) {
      toast.error("Login failed", {
        description: error.message || "An unexpected error occurred",
      })

      return { success: false, error: error.message }
    }
  }

  // Handle registration
  const register = async (userData: any) => {
    try {
      const result = await TrustSystem.registerUser(userData)

      if (result.success) {
        toast.success("Registration successful", {
          description: "Your account has been created. Please verify your email.",
        })

        // Redirect to products page after successful registration
        router.push("/products")
      } else {
        toast.error("Registration failed", {
          description: result.error,
        })
      }

      return result
    } catch (error: any) {
      toast.error("Registration failed", {
        description: error.message || "An unexpected error occurred",
      })

      return { success: false, error: error.message }
    }
  }

  // Handle logout
  const logout = async () => {
    try {
      const result = await TrustSystem.logoutUser()

      if (result.success) {
        setUserData(null)
        router.push("/login")

        toast.success("Logout successful", {
          description: "You have been logged out.",
        })
      } else {
        toast.error("Logout failed", {
          description: result.error,
        })
      }

      return result
    } catch (error: any) {
      toast.error("Logout failed", {
        description: error.message || "An unexpected error occurred",
      })

      return { success: false, error: error.message }
    }
  }

  // Check if user has a specific permission
  const hasPermission = async (permission: string) => {
    if (!user) return false
    return TrustSystem.hasPermission(user.uid, permission)
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)

      if (currentUser) {
        await fetchUserData(currentUser)
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Protect routes based on authentication status
  useEffect(() => {
    if (loading) return

    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/signup", "/", "/products"]

    // Routes that require authentication
    const protectedRoutes = ["/account", "/checkout", "/cart", "/order-confirmation"]

    // Admin-only routes
    const adminRoutes = ["/admin"]

    // Vendor-only routes
    const vendorRoutes = ["/vendor"]

    // Check if current path is protected
    const isProtectedRoute = protectedRoutes.some((route) => pathname?.startsWith(route))
    const isAdminRoute = adminRoutes.some((route) => pathname?.startsWith(route))
    const isVendorRoute = vendorRoutes.some((route) => pathname?.startsWith(route))
    const isPublicRoute = publicRoutes.some((route) => pathname === route)

    if (!user && isProtectedRoute) {
      // Redirect to login if trying to access protected route without authentication
      router.push("/login")
    } else if (user && isAdminRoute && userData?.role !== "admin") {
      // Redirect if trying to access admin route without admin role
      toast.error("Access denied", {
        description: "You don't have permission to access this page.",
      })
      router.push("/products")
    } else if (user && isVendorRoute && userData?.role !== "vendor") {
      // Redirect if trying to access vendor route without vendor role
      toast.error("Access denied", {
        description: "You don't have permission to access this page.",
      })
      router.push("/products")
    }
  }, [loading, user, userData, pathname, router])

  const contextValue = {
    user,
    userData,
    loading,
    isAdmin: userData?.role === "admin",
    isVendor: userData?.role === "vendor",
    isCustomer: userData?.role === "customer",
    trustScore: userData?.trustScore || 0,
    hasPermission,
    login,
    register,
    logout,
    refreshUserData,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      <CartProvider>{children}</CartProvider>
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
