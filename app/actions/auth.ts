"use server"

import { cookies } from "next/headers"

export async function validateLogin(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  console.log("[v0] Login attempt:")
  console.log("[v0] Provided email:", email)
  console.log("[v0] Provided email length:", email.length)
  console.log("[v0] Expected email:", adminEmail)
  console.log("[v0] Expected email length:", adminEmail?.length)
  console.log("[v0] Provided password:", password)
  console.log("[v0] Provided password length:", password.length)
  console.log("[v0] Expected password:", adminPassword)
  console.log("[v0] Expected password length:", adminPassword?.length)
  console.log("[v0] Email match:", email === adminEmail)
  console.log("[v0] Password match:", password === adminPassword)
  console.log("[v0] Email trimmed match:", email.trim() === adminEmail?.trim())
  console.log("[v0] Password trimmed match:", password.trim() === adminPassword?.trim())

  if (!adminEmail || !adminPassword) {
    return {
      success: false,
      error: "Server configuration error. Please set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.",
    }
  }

  if (email.trim() === adminEmail.trim() && password.trim() === adminPassword.trim()) {
    // Set auth cookie
    const cookieStore = await cookies()
    cookieStore.set("auth-token", "authenticated", {
      path: "/",
      maxAge: 86400, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    console.log("[v0] Login successful!")
    return { success: true }
  }

  console.log("[v0] Login failed - credentials don't match")
  return {
    success: false,
    error: "Invalid email or password",
  }
}
