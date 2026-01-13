import { type NextRequest, NextResponse } from "next/server"
import { getGA4Client, getDateRange } from "@/lib/ga4-client"

/**
 * GET /api/analytics/top-articles
 *
 * Fetches the top 3 articles by page views from Google Analytics 4
 *
 * Query Parameters:
 * - timeRange: string (optional) - Time period to analyze. Options:
 *   - "today", "yesterday"
 *   - "7d", "14d", "30d", "60d", "90d"
 *   - "6m", "1y"
 *   - "thisMonth", "lastMonth", "thisYear"
 *   Default: "7d"
 *
 * Response Format:
 * {
 *   "success": boolean,
 *   "data": [
 *     {
 *       "id": number,
 *       "title": string,
 *       "category": string,
 *       "views": number,
 *       "clicks": number (estimated),
 *       "engagement": number (minutes),
 *       "date": string (ISO date),
 *       "path": string,
 *       "bounceRate": number (percentage)
 *     }
 *   ],
 *   "source": "ga4" | "mock",
 *   "timeRange": {
 *     "startDate": string,
 *     "endDate": string
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("timeRange") || "7d"
    const propertyId = process.env.GA4_PROPERTY_ID

    console.log("[v0] Top Articles API - Fetching for time range:", timeRange)

    const analyticsData = getGA4Client()

    // If GA4 is not configured, return mock data
    if (!analyticsData || !propertyId) {
      console.log("[v0] Top Articles API - GA4 not configured, returning mock data")
      return NextResponse.json({
        success: true,
        data: getMockTopArticles(),
        source: "mock",
        timeRange: getDateRange(timeRange),
      })
    }

    const { startDate, endDate } = getDateRange(timeRange)

    console.log("[v0] Top Articles API - Querying GA4 from", startDate, "to", endDate)

    // Fetch top pages from GA4
    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pageTitle" }, { name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "activeUsers" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 3, // Only fetch top 3 articles
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: {
              matchType: "CONTAINS",
              value: "/blog/",
            },
          },
        },
      },
    })

    console.log("[v0] Top Articles API - GA4 returned", response.data.rows?.length || 0, "rows")

    // Transform GA4 data
    const articles =
      response.data.rows?.map((row, index) => {
        const pagePath = row.dimensionValues?.[1]?.value || ""
        const pageTitle = row.dimensionValues?.[0]?.value || "Untitled"
        const views = Number.parseInt(row.metricValues?.[0]?.value || "0")
        const avgDuration = Number.parseFloat(row.metricValues?.[1]?.value || "0")
        const bounceRate = Number.parseFloat(row.metricValues?.[2]?.value || "0") * 100
        const activeUsers = Number.parseInt(row.metricValues?.[3]?.value || "0")

        // Extract category from URL path (e.g., /blog/technology/article-name -> Technology)
        let category = "Uncategorized"
        const blogMatch = pagePath.match(/\/blog\/([^/]+)/)
        if (blogMatch && blogMatch[1]) {
          category = blogMatch[1]
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        }

        // Estimate clicks (assuming 15% CTR on page views)
        const estimatedClicks = Math.floor(views * 0.15)

        // Convert engagement to minutes
        const engagementMinutes = Number.parseFloat((avgDuration / 60).toFixed(1))

        return {
          id: index + 1,
          title: pageTitle,
          category,
          views,
          clicks: estimatedClicks,
          engagement: engagementMinutes,
          date: endDate,
          path: pagePath,
          bounceRate: Number.parseFloat(bounceRate.toFixed(2)),
          activeUsers,
        }
      }) || []

    console.log(
      "[v0] Top Articles API - Processed articles:",
      articles.map((a) => ({ title: a.title, views: a.views })),
    )

    return NextResponse.json({
      success: true,
      data: articles,
      source: "ga4",
      timeRange: {
        startDate,
        endDate,
      },
    })
  } catch (error) {
    console.error("[v0] Top Articles API - Error:", error)

    return NextResponse.json({
      success: false,
      data: getMockTopArticles(),
      source: "mock",
      error: error instanceof Error ? error.message : "Unknown error",
      timeRange: getDateRange("7d"),
    })
  }
}

/**
 * Fallback mock data for when GA4 is not available
 */
function getMockTopArticles() {
  return [
    {
      id: 1,
      title: "Getting Started with Next.js 15",
      category: "Technology",
      views: 1250,
      clicks: 187,
      engagement: 4.5,
      date: new Date().toISOString().split("T")[0],
      path: "/blog/technology/getting-started-nextjs-15",
      bounceRate: 35.2,
      activeUsers: 890,
    },
    {
      id: 2,
      title: "Understanding React Server Components",
      category: "Development",
      views: 980,
      clicks: 147,
      engagement: 5.2,
      date: new Date().toISOString().split("T")[0],
      path: "/blog/development/react-server-components",
      bounceRate: 28.4,
      activeUsers: 720,
    },
    {
      id: 3,
      title: "AI-Powered Analytics Dashboard Guide",
      category: "Analytics",
      views: 875,
      clicks: 131,
      engagement: 6.1,
      date: new Date().toISOString().split("T")[0],
      path: "/blog/analytics/ai-powered-dashboard-guide",
      bounceRate: 31.8,
      activeUsers: 650,
    },
  ]
}
