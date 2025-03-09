import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Registration - Farmart",
  description: "Create a new administrator account for Farmart grocery management system",
}

export default function AdminSignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

