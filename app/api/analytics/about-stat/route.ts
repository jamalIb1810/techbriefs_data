import { type NextRequest, NextResponse } from "next/server"
import { getGA4Client } from "@/lib/ga4-client"

export async function GET(request: NextRequest) {
  try {
    const propertyId = process.env.GA4_PROPERTY_ID
    const analyticsData = getGA4Client()

    if (!analyticsData || !propertyId) {
      return NextResponse.json({
        success: true,
        data: { monthlyReaders: 0, countries: 0 },
        source: "mock",
      })
    }

    // Run both queries in parallel
    const [readersRes, countriesRes] = await Promise.all([
      // Avg monthly active users — last 3 months
      analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
          dimensions: [{ name: "yearMonth" }],
          metrics: [{ name: "activeUsers" }],
        },
      }),
      // All-time unique countries
      analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: "2020-01-01", endDate: "today" }],
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }],
        },
      }),
    ])

    const months = readersRes.data.rows || []
    const totalUsers = months.reduce(
      (sum, row) => sum + Number(row.metricValues?.[0]?.value || 0),
      0
    )
    const monthlyReaders = months.length > 0 ? Math.round(totalUsers / months.length) : 0

    const countries = (countriesRes.data.rows || []).length

    return NextResponse.json({
      success: true,
      data: { monthlyReaders, countries },
      source: "ga4",
    })
  } catch (error) {
    console.error("[about-stats] Error:", error)
    return NextResponse.json({
      success: true,
      data: { monthlyReaders: 0, countries: 0 },
      source: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
