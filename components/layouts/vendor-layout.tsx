"use client"

import { type ReactNode, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Home, Settings, ShoppingCart, Package, Store, LogOut } from "lucide-react"

interface VendorLayoutProps {
  children: ReactNode
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  const router = useRouter()

  useEffect(() => {
    const checkVendor = async () => {
      const user = auth.currentUser

      if (!user) {
        router.push("/login")
        return
      }

      // Check if user is vendor
      try {
        const vendorDocs = await getDocs(
          query(collection(db, "users"), where("email", "==", user.email), where("role", "==", "vendor")),
        )

        if (vendorDocs.empty) {
          router.push("/")
        }
      } catch (error) {
        console.error("Error checking vendor status:", error)
        router.push("/")
      }
    }

    checkVendor()
  }, [router])

  const handleLogout = async () => {
    try {
      await auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 border-r bg-white h-screen sticky top-0">
        <div className="p-6">
          <h2 className="text-xl font-bold">Vendor Panel</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/vendor/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <Link href="/vendor/products">
            <Button variant="ghost" className="w-full justify-start">
              <Package className="mr-2 h-4 w-4" /> Products
            </Button>
          </Link>
          <Link href="/vendor/orders">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCart className="mr-2 h-4 w-4" /> Orders
            </Button>
          </Link>
          <Link href="/vendor/store">
            <Button variant="ghost" className="w-full justify-start">
              <Store className="mr-2 h-4 w-4" /> Store Profile
            </Button>
          </Link>
          <Link href="/vendor/settings">
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}

