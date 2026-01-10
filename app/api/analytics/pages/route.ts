import { type NextRequest, NextResponse } from "next/server"
import { getGA4Client, getDateRange } from "@/lib/ga4-client"
import { mockArticles } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("timeRange") || "7d"
    const propertyId = process.env.GA4_PROPERTY_ID

    console.log("[v0] Fetching page analytics for time range:", timeRange)

    const analyticsData = getGA4Client()

    // If GA4 is not configured, return mock data
    if (!analyticsData || !propertyId) {
      console.log("[v0] GA4 not configured, returning mock articles")
      return NextResponse.json({
        success: true,
        data: mockArticles,
        source: "mock",
      })
    }

    const { startDate, endDate } = getDateRange(timeRange)

    // Fetch page-level metrics from GA4
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pageTitle" }, { name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "averageSessionDuration" }, { name: "bounceRate" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 50,
      },
    })

    // Transform GA4 data to match our articles format
    const articles =
      response.data.rows?.map((row, index) => {
        const pagePath = row.dimensionValues?.[1]?.value || ""
        let category = "Uncategorized"

        // Parse category from path like /blog/technology/article-title
        const blogMatch = pagePath.match(/\/blog\/([^/]+)/)
        if (blogMatch && blogMatch[1]) {
          // Capitalize first letter of category
          category = blogMatch[1]
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        }

        return {
          id: index + 1,
          title: row.dimensionValues?.[0]?.value || "Untitled",
          category,
          views: Number.parseInt(row.metricValues?.[0]?.value || "0"),
          clicks: Math.floor(Number.parseInt(row.metricValues?.[0]?.value || "0") * 0.15), // Estimate
          engagement: Number.parseFloat((Number.parseInt(row.metricValues?.[1]?.value || "0") / 60).toFixed(1)),
          date: new Date().toISOString().split("T")[0],
        }
      }) || []

    console.log("[v0] Successfully fetched GA4 pages data:", articles.length, "pages")
    console.log("[v0] Sample article with category:", articles[0])

    return NextResponse.json({
      success: true,
      data: articles,
      source: "ga4",
    })
  } catch (error) {
    console.error("[v0] Error fetching GA4 pages data:", error)
    // Return mock data as fallback
    return NextResponse.json({
      success: true,
      data: mockArticles,
      source: "mock",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
