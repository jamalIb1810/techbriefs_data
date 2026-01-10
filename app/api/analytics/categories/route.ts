import { type NextRequest, NextResponse } from "next/server"
import { getGA4Client, getDateRange } from "@/lib/ga4-client"
import { categoryStats } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("timeRange") || "7d"
    const propertyId = process.env.GA4_PROPERTY_ID

    console.log("[v0] Fetching category analytics for time range:", timeRange)

    const analyticsData = getGA4Client()

    // If GA4 is not configured, return mock data
    if (!analyticsData || !propertyId) {
      console.log("[v0] GA4 not configured, returning mock categories")
      return NextResponse.json({
        success: true,
        data: categoryStats,
        source: "mock",
      })
    }

    const { startDate, endDate } = getDateRange(timeRange)

    // Fetch page-level metrics from GA4
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "sessions" }],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: {
              matchType: "CONTAINS",
              value: "/blog/",
            },
          },
        },
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 100,
      },
    })

    // Extract and aggregate by category
    const categoryMap = new Map<string, { views: number; sessions: number; articles: Set<string> }>()

    response.data.rows?.forEach((row) => {
      const pagePath = row.dimensionValues?.[0]?.value || ""
      const views = Number.parseInt(row.metricValues?.[0]?.value || "0")
      const sessions = Number.parseInt(row.metricValues?.[1]?.value || "0")

      // Parse category from path like /blog/{category}/...
      const blogMatch = pagePath.match(/\/blog\/([^/]+)/)
      if (blogMatch && blogMatch[1]) {
        const categorySlug = blogMatch[1]
        const category = categorySlug
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        if (!categoryMap.has(category)) {
          categoryMap.set(category, { views: 0, sessions: 0, articles: new Set() })
        }

        const data = categoryMap.get(category)!
        data.views += views
        data.sessions += sessions
        data.articles.add(pagePath)
      }
    })

    // Transform to array format
    const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      views: data.views,
      articles: data.articles.size,
      avgCTR: data.sessions > 0 ? ((data.sessions / data.views) * 100).toFixed(1) : "0.0",
    }))

    // Sort by views
    categories.sort((a, b) => b.views - a.views)

    console.log("[v0] Successfully fetched GA4 categories data:", categories.length, "categories")
    console.log("[v0] Categories:", categories)

    return NextResponse.json({
      success: true,
      data: categories,
      source: "ga4",
    })
  } catch (error) {
    console.error("[v0] Error fetching GA4 categories data:", error)
    // Return mock data as fallback
    return NextResponse.json({
      success: true,
      data: categoryStats,
      source: "mock",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
