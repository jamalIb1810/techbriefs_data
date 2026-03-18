import { NextResponse } from "next/server"
import { getAnalytics } from "@/lib/ga4-client"
import { getDateRange } from "@/lib/ga4-client"

export async function GET() {
  try {
    const analytics = await getAnalytics()
    const propertyId = process.env.NEXT_PUBLIC_GA4_PROPERTY_ID

    if (!propertyId) {
      return NextResponse.json({ monthlyReaders: 0, countries: 0 })
    }

    const { startDate: monthlyStart, endDate: monthlyEnd } = getDateRange("90d")
    const { startDate: countriesStart } = getDateRange("1y")

    // Fetch monthly active users for last 90 days
    const monthlyResponse = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: monthlyStart, endDate: monthlyEnd }],
        dimensions: [{ name: "yearMonth" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "yearMonth" }, desc: true }],
      },
    })

    const monthlyReaders =
      parseInt(
        monthlyResponse.data.rows?.[0]?.metricValues?.[0]?.value || "0"
      ) || 0

    // Fetch unique countries
    const countriesResponse = await analytics.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: countriesStart, endDate: monthlyEnd }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        limit: 1,
      },
    })

    const countries = (countriesResponse.data.rows || []).length

    return NextResponse.json({ monthlyReaders, countries })
  } catch (error) {
    console.error("[v0] Error fetching about stats:", error)
    return NextResponse.json({ monthlyReaders: 0, countries: 0 })
  }
}
