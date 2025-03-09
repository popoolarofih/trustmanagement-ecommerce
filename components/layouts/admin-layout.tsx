"use client"

import { type ReactNode, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Home, Settings, ShoppingCart, Package2, Users, LogOut } from "lucide-react"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser

      if (!user) {
        router.push("/login")
        return
      }

      // Check if user is admin
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        const userData = userDoc.data()

        if (!userData || userData.role !== "admin") {
          router.push("/")
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
        router.push("/")
      }
    }

    checkAdmin()
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
          <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" /> Dashboard
            </Button>
          </Link>
          <Link href="/admin/products">
            <Button variant="ghost" className="w-full justify-start">
              <Package2 className="mr-2 h-4 w-4" /> Products
            </Button>
          </Link>
          <Link href="/admin/orders">
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCart className="mr-2 h-4 w-4" /> Orders
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="ghost" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" /> Users
            </Button>
          </Link>
          <Link href="/admin/settings">
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

