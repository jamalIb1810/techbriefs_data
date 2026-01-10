import { type NextRequest, NextResponse } from "next/server"
import { getGA4Client, getDateRange } from "@/lib/ga4-client"
import { mockAnalyticsData } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("timeRange") || "7d"
    const propertyId = process.env.GA4_PROPERTY_ID

    console.log("[v0] Fetching overview analytics for time range:", timeRange)

    const analyticsData = getGA4Client()

    // If GA4 is not configured, return mock data
    if (!analyticsData || !propertyId) {
      console.log("[v0] GA4 not configured, returning mock data")
      return NextResponse.json({
        success: true,
        data: mockAnalyticsData,
        source: "mock",
      })
    }

    const { startDate, endDate } = getDateRange(timeRange)

    console.log("[v0] Date range:", { startDate, endDate })

    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "screenPageViews" }, // This is the "Views" metric in GA4
          { name: "eventCount" }, // Total events
          { name: "userEngagementDuration" }, // Engagement time
        ],
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      },
    })

    console.log("[v0] GA4 Response rows:", response.data.rows?.length)

    // Transform GA4 data to match our chart format
    const chartData =
      response.data.rows?.map((row) => {
        const views = Number.parseInt(row.metricValues?.[0]?.value || "0")
        const events = Number.parseInt(row.metricValues?.[1]?.value || "0")
        const engagementSeconds = Number.parseInt(row.metricValues?.[2]?.value || "0")

        return {
          date: row.dimensionValues?.[0]?.value || "",
          views: views,
          clicks: Math.floor(events * 0.05), // Estimate clicks as 5% of events
          engagement: Number.parseFloat((engagementSeconds / 60).toFixed(1)), // Convert to minutes
        }
      }) || []

    const totalViews = chartData.reduce((sum, item) => sum + item.views, 0)
    console.log("[v0] Total views calculated:", totalViews)
    console.log("[v0] Data points:", chartData.length)
    console.log("[v0] Date range in data:", {
      first: chartData[0]?.date,
      last: chartData[chartData.length - 1]?.date,
    })

    return NextResponse.json({
      success: true,
      data: chartData,
      source: "ga4",
      metadata: {
        totalViews,
        dateRange: { startDate, endDate },
        dataPoints: chartData.length,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching GA4 overview data:", error)
    // Return mock data as fallback
    return NextResponse.json({
      success: true,
      data: mockAnalyticsData,
      source: "mock",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
