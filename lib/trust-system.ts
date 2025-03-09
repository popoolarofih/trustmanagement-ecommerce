import {
    type User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    updateProfile,
    EmailAuthProvider,
    reauthenticateWithCredential,
  } from "firebase/auth"
  import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    increment,
    arrayUnion,
    Timestamp,
  } from "firebase/firestore"
  import { auth, db } from "@/lib/firebase"
  import { z } from "zod"
  
  // Define validation schemas using Zod
  export const userSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    role: z.enum(["admin", "vendor", "customer"]),
  })
  
  export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  })
  
  // Trust levels and their descriptions
  export const TRUST_LEVELS = {
    1: "New user - Limited access",
    2: "Basic user - Standard access",
    3: "Verified user - Enhanced access",
    4: "Trusted user - Premium access",
    5: "Elite user - Full access",
  }
  
  // User roles and their permissions
  export const ROLE_PERMISSIONS = {
    admin: ["manage_users", "manage_products", "manage_orders", "manage_trust", "view_analytics"],
    vendor: ["manage_own_products", "view_own_orders", "update_profile"],
    customer: ["place_orders", "view_own_orders", "update_profile"],
  }
  
  // Trust system functions
  export const TrustSystem = {
    // Register a new user with validation
    async registerUser(userData: z.infer<typeof userSchema>) {
      try {
        // Validate user data
        userSchema.parse(userData)
  
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
  
        const user = userCredential.user
  
        // Send email verification
        await sendEmailVerification(user)
  
        // Update profile with name
        await updateProfile(user, {
          displayName: userData.name,
        })
  
        // Create user document in Firestore with trust score
        await setDoc(doc(db, "users", user.uid), {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          trustScore: userData.role === "vendor" ? 3 : 4, // Initial trust score
          emailVerified: false,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          loginCount: 1,
          trustHistory: [
            {
              score: userData.role === "vendor" ? 3 : 4,
              reason: "Account creation",
              timestamp: Timestamp.now(),
            },
          ],
          securityLevel: "standard",
          permissions: ROLE_PERMISSIONS[userData.role],
          accountStatus: "active",
        })
  
        // Create security log entry
        await this.logSecurityEvent(user.uid, "account_created", {
          email: userData.email,
          role: userData.role,
          method: "email/password",
        })
  
        return { success: true, user }
      } catch (error: any) {
        console.error("Registration error:", error)
        return {
          success: false,
          error: error.message || "Failed to register user",
        }
      }
    },
  
    // Login with validation and security checks
    async loginUser(credentials: z.infer<typeof loginSchema>) {
      try {
        // Validate login data
        loginSchema.parse(credentials)
  
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
  
        const user = userCredential.user
  
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid))
  
        if (!userDoc.exists()) {
          throw new Error("User data not found")
        }
  
        const userData = userDoc.data()
  
        // Check if account is locked or suspended
        if (userData.accountStatus === "locked" || userData.accountStatus === "suspended") {
          await signOut(auth)
          throw new Error(`Your account is ${userData.accountStatus}. Please contact support.`)
        }
  
        // Update user login information
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: serverTimestamp(),
          loginCount: increment(1),
          emailVerified: user.emailVerified,
        })
  
        // Log login event
        await this.logSecurityEvent(user.uid, "login_successful", {
          method: "email/password",
          timestamp: new Date().toISOString(),
        })
  
        return {
          success: true,
          user,
          userData: {
            ...userData,
            id: user.uid,
          },
        }
      } catch (error: any) {
        console.error("Login error:", error)
  
        // Log failed login attempt if we can identify the user
        if (error.code !== "auth/user-not-found") {
          try {
            const userQuery = query(collection(db, "users"), where("email", "==", credentials.email))
            const userDocs = await getDocs(userQuery)
  
            if (!userDocs.empty) {
              const userId = userDocs.docs[0].id
              await this.logSecurityEvent(userId, "login_failed", {
                reason: error.code || "unknown_error",
                timestamp: new Date().toISOString(),
              })
  
              // Check for multiple failed attempts and lock account if necessary
              const securityLogsQuery = query(
                collection(db, "securityLogs"),
                where("userId", "==", userId),
                where("event", "==", "login_failed"),
                where("timestamp", ">=", new Date(Date.now() - 30 * 60 * 1000)), // Last 30 minutes
              )
  
              const recentFailedLogs = await getDocs(securityLogsQuery)
  
              if (recentFailedLogs.size >= 5) {
                // Lock account after 5 failed attempts in 30 minutes
                await updateDoc(doc(db, "users", userId), {
                  accountStatus: "locked",
                  lockReason: "Multiple failed login attempts",
                  lockedAt: serverTimestamp(),
                })
  
                await this.logSecurityEvent(userId, "account_locked", {
                  reason: "Multiple failed login attempts",
                  failedAttempts: recentFailedLogs.size,
                })
              }
            }
          } catch (logError) {
            console.error("Error logging failed login:", logError)
          }
        }
  
        return {
          success: false,
          error: error.message || "Failed to login",
        }
      }
    },
  
    // Log out user
    async logoutUser() {
      try {
        const user = auth.currentUser
        if (user) {
          await this.logSecurityEvent(user.uid, "logout", {
            timestamp: new Date().toISOString(),
          })
        }
  
        await signOut(auth)
        return { success: true }
      } catch (error: any) {
        console.error("Logout error:", error)
        return {
          success: false,
          error: error.message || "Failed to logout",
        }
      }
    },
  
    // Check if user has permission
    async hasPermission(userId: string, permission: string): Promise<boolean> {
      try {
        const userDoc = await getDoc(doc(db, "users", userId))
  
        if (!userDoc.exists()) {
          return false
        }
  
        const userData = userDoc.data()
        return userData.permissions?.includes(permission) || false
      } catch (error) {
        console.error("Permission check error:", error)
        return false
      }
    },
  
    // Update user trust score
    async updateTrustScore(userId: string, newScore: number, reason: string) {
      try {
        // Validate score range
        if (newScore < 1 || newScore > 5) {
          throw new Error("Trust score must be between 1 and 5")
        }
  
        // Update user document
        await updateDoc(doc(db, "users", userId), {
          trustScore: newScore,
          trustHistory: arrayUnion({
            score: newScore,
            reason,
            timestamp: Timestamp.now(),
          }),
        })
  
        // Log trust score update
        await this.logSecurityEvent(userId, "trust_score_updated", {
          newScore,
          reason,
          timestamp: new Date().toISOString(),
        })
  
        return { success: true }
      } catch (error: any) {
        console.error("Trust score update error:", error)
        return {
          success: false,
          error: error.message || "Failed to update trust score",
        }
      }
    },
  
    // Log security events
    async logSecurityEvent(userId: string, event: string, details: any) {
      try {
        await setDoc(doc(collection(db, "securityLogs")), {
          userId,
          event,
          details,
          ipAddress: "client-side", // In a real app, you'd get this from the server
          userAgent: navigator.userAgent,
          timestamp: serverTimestamp(),
        })
  
        return { success: true }
      } catch (error: any) {
        console.error("Security log error:", error)
        return {
          success: false,
          error: error.message || "Failed to log security event",
        }
      }
    },
  
    // Send password reset email
    async sendPasswordReset(email: string) {
      try {
        await sendPasswordResetEmail(auth, email)
  
        // Try to find user to log the event
        const userQuery = query(collection(db, "users"), where("email", "==", email))
        const userDocs = await getDocs(userQuery)
  
        if (!userDocs.empty) {
          const userId = userDocs.docs[0].id
          await this.logSecurityEvent(userId, "password_reset_requested", {
            email,
            timestamp: new Date().toISOString(),
          })
        }
  
        return { success: true }
      } catch (error: any) {
        console.error("Password reset error:", error)
        return {
          success: false,
          error: error.message || "Failed to send password reset email",
        }
      }
    },
  
    // Verify user's current password (for sensitive operations)
    async verifyPassword(user: User, password: string): Promise<boolean> {
      try {
        const credential = EmailAuthProvider.credential(user.email || "", password)
  
        await reauthenticateWithCredential(user, credential)
        return true
      } catch (error) {
        console.error("Password verification error:", error)
        return false
      }
    },
  
    // Get user's trust level description
    getTrustLevelDescription(score: number): string {
      const level = Math.min(Math.max(Math.round(score), 1), 5)
      return TRUST_LEVELS[level as keyof typeof TRUST_LEVELS]
    },
  
    // Check if user can perform an action based on trust score
    canPerformAction(trustScore: number, requiredScore: number): boolean {
      return trustScore >= requiredScore
    },
  }
  
  // Export types for TypeScript support
  export type UserRole = "admin" | "vendor" | "customer"
  
  export interface TrustHistoryEntry {
    score: number
    reason: string
    timestamp: Timestamp
  }
  
  export interface UserData {
    id: string
    name: string
    email: string
    role: UserRole
    trustScore: number
    emailVerified: boolean
    createdAt: Timestamp
    lastLogin: Timestamp
    loginCount: number
    trustHistory: TrustHistoryEntry[]
    securityLevel: string
    permissions: string[]
    accountStatus: "active" | "locked" | "suspended"
  }
  
  