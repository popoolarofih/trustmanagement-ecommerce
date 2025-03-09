export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  category: string
  imageUrl: string
  vendorId: string
  vendorName: string
  inStock: boolean
  createdAt: string
  trustScore?: number
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "vendor" | "customer"
  createdAt: string
  trustScore?: number
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  customerEmail: string
  vendorId: string
  vendorName: string
  items: {
    productId: string
    name: string
    price: number
    quantity: number
  }[]
  totalAmount: number
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: string
  shippingAddress?: string
  paymentMethod?: string
  reviewed?: boolean
  vendorTrustScore?: number
}

export interface Review {
  id: string
  orderId: string
  vendorId: string
  customerId: string
  rating: number
  review: string
  createdAt: string
}

