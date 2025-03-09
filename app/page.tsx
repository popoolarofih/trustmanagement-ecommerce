import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProductGrid from "@/components/product-grid";
import { ShoppingCart, ShoppingBag, Truck } from "lucide-react";
import Image from "next/image";
import hero from "./basket-with-vegetables.jpg";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Sticky Header with Backdrop Blur */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b shadow-sm">
        <div className="container mx-auto flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Farmart
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/cart">
              <Button variant="outline" size="icon">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="font-medium">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="font-medium">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="mb-12 md:mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                Fresh Groceries Delivered Daily
              </h2>
              <p className="text-base sm:text-lg text-gray-700">
                Experience the charm of traditional markets reimagined for today’s fast-paced world. Enjoy organic produce and essential groceries delivered right to your doorstep.
              </p>
              <Link href="/signup">
                <Button className="px-8 py-3 text-base sm:text-lg">Shop Now</Button>
              </Link>
              <div className="mt-6 sm:mt-8 flex gap-6 sm:gap-8">
                <div className="flex flex-col items-center">
                  <Truck className="h-8 w-8 sm:h-10 sm:w-10 text-secondary animate-bounce" />
                  <span className="mt-1 text-xs sm:text-sm font-semibold">Fast Delivery</span>
                </div>
                <div className="flex flex-col items-center">
                  <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 text-accent animate-bounce" />
                  <span className="mt-1 text-xs sm:text-sm font-semibold">Quality Products</span>
                </div>
                <div className="flex flex-col items-center">
                  <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-primary animate-bounce" />
                  <span className="mt-1 text-xs sm:text-sm font-semibold">Easy Checkout</span>
                </div>
              </div>
            </div>
            <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-2xl transform transition duration-500 hover:scale-105">
              <Image 
                src={hero} 
                alt="Fresh Groceries" 
                fill 
                className="object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-20"></div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 md:mb-8">Featured Products</h2>
          <ProductGrid />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-6 sm:py-8">
        <div className="container mx-auto text-center px-4 sm:px-6 lg:px-8">
          <p className="text-gray-500 text-xs sm:text-sm">
            © 2025 Executive Tech. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
