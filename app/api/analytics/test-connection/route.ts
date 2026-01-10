import { NextResponse } from "next/server"
import { getGA4Client } from "@/lib/ga4-client"

export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    envVarsPresent: {
      GA4_PROPERTY_ID: !!process.env.GA4_PROPERTY_ID,
      GA4_SERVICE_ACCOUNT_JSON: !!process.env.GA4_SERVICE_ACCOUNT_JSON,
    },
    propertyId: process.env.GA4_PROPERTY_ID || null,
    clientInitialized: false,
    connectionTest: null as any,
    overallStatus: "failed" as "success" | "failed",
  }

  console.log("[v0] Testing GA4 connection...")
  console.log("[v0] Environment variables present:", results.envVarsPresent)

  // Test if client can be initialized
  const analyticsData = getGA4Client()
  results.clientInitialized = !!analyticsData

  if (!analyticsData || !process.env.GA4_PROPERTY_ID) {
    console.error("[v0] GA4 client initialization failed - missing credentials or property ID")
    return NextResponse.json({
      success: false,
      message: "GA4 not configured properly. Missing environment variables.",
      details: results,
    })
  }

  // Test actual API call
  try {
    console.log("[v0] Testing API call to GA4...")
    const response = await analyticsData.properties.runReport({
      property: `properties/${process.env.GA4_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        metrics: [{ name: "screenPageViews" }],
        limit: 1,
      },
    })

    const totalViews = response.data.rows?.[0]?.metricValues?.[0]?.value || "0"

    results.connectionTest = {
      success: true,
      message: "Successfully connected to GA4",
      sampleData: {
        totalViews: Number.parseInt(totalViews),
        rowsReturned: response.data.rows?.length || 0,
      },
    }
    results.overallStatus = "success"

    console.log("[v0] GA4 connection test successful!")
    console.log("[v0] Sample data retrieved:", results.connectionTest.sampleData)

    return NextResponse.json({
      success: true,
      message: "GA4 connection successful! You are receiving real data.",
      details: results,
    })
  } catch (error: any) {
    console.error("[v0] GA4 API call failed:", error.message)
    console.error("[v0] Full error:", error)

    results.connectionTest = {
      success: false,
      error: error.message || "Unknown error",
      details: error.code || null,
    }

    return NextResponse.json({
      success: false,
      message: "GA4 connection failed. Check your credentials and permissions.",
      details: results,
    })
  }
}
