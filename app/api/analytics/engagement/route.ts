import { NextResponse } from "next/server"
import { getGA4Client, getDateRange } from "@/lib/ga4-client"

// Engagement event names tracked in GA4
const ENGAGEMENT_EVENTS = [
  "comment_post",
  "comment_reply",
  "article_reaction",
  "article_save",
  "article_summarized",
  "newsletter_subscribe",
  "newsletter_unsubscribe",
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get("timeRange") || "7d"
  const propertyId = process.env.GA4_PROPERTY_ID

  const { startDate, endDate } = getDateRange(timeRange)

  if (!propertyId) {
    return NextResponse.json(mockEngagementData(startDate, endDate))
  }

  const analyticsData = getGA4Client()
  if (!analyticsData) {
    return NextResponse.json(mockEngagementData(startDate, endDate))
  }

  try {
    // Fetch ALL event counts with NO filter — then filter client-side
    const eventCountsResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "eventName" }],
        metrics: [
          { name: "eventCount" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 100,
      },
    })

    // Fetch daily trend
    const trendResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }, { name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: 1000,
      },
    })

    // Log all event names GA4 returned
    const allEventNames = (eventCountsResponse.data.rows || []).map(
      (r) => r.dimensionValues?.[0]?.value
    )

    // Process event counts
    const eventTotals: Record<string, { count: number; users: number }> = {}
    for (const row of eventCountsResponse.data.rows || []) {
      const name = (row.dimensionValues?.[0]?.value || "").trim()
      eventTotals[name] = {
        count: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
      }
    }

    // Process daily trend for key engagement events
    const TREND_EVENTS = new Set(["comment_post", "article_reaction", "article_save", "newsletter_subscribe"])
    const trendMap: Record<string, Record<string, number>> = {}
    for (const row of trendResponse.data.rows || []) {
      const date = row.dimensionValues?.[0]?.value || ""
      const event = (row.dimensionValues?.[1]?.value || "").trim()
      if (!TREND_EVENTS.has(event)) continue
      const count = parseInt(row.metricValues?.[0]?.value || "0")
      if (!trendMap[date]) trendMap[date] = {}
      trendMap[date][event] = count
    }

    const dailyTrend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, evs]) => ({
        date,
        comment_post: evs["comment_post"] || 0,
        article_reaction: evs["article_reaction"] || 0,
        article_save: evs["article_save"] || 0,
        newsletter_subscribe: evs["newsletter_subscribe"] || 0,
      }))

    // Build per-event summary
    const events = ENGAGEMENT_EVENTS.map((name) => ({
      name,
      count: eventTotals[name]?.count || 0,
      users: eventTotals[name]?.users || 0,
    }))

    // Get totals for summary
    const allReturnedEvents = allEventNames.filter(Boolean) as string[]
    const totalComments = (eventTotals["comment_post"]?.count || 0) + (eventTotals["comment_reply"]?.count || 0)
    const totalReactions = eventTotals["article_reaction"]?.count || 0
    const totalSaves = eventTotals["article_save"]?.count || 0
    const totalSummarized = eventTotals["article_summarized"]?.count || 0
    const totalSubscribes = eventTotals["newsletter_subscribe"]?.count || 0
    const totalUnsubscribes = eventTotals["newsletter_unsubscribe"]?.count || 0

    return NextResponse.json({
      source: "ga4",
      dateRange: { startDate, endDate },
      allReturnedEvents,
      summary: {
        totalComments,
        totalReactions,
        totalSaves,
        totalSummarized,
        netSubscribers: totalSubscribes - totalUnsubscribes,
        totalSubscribes,
        totalUnsubscribes,
      },
      events,
      dailyTrend,
    })
  } catch (error: any) {
    const errMsg = error?.message || "Unknown error"
    console.error("[v0] GA4 engagement API error:", errMsg)
    return NextResponse.json({
      ...mockEngagementData(startDate, endDate),
      error: errMsg,
    })
  }
}

function mockEngagementData(startDate: string, endDate: string) {
  return {
    source: "mock",
    dateRange: { startDate, endDate },
    summary: {
      totalComments: 0,
      totalReactions: 0,
      totalSaves: 0,
      totalSummarized: 0,
      netSubscribers: 0,
      totalSubscribes: 0,
      totalUnsubscribes: 0,
    },
    events: ENGAGEMENT_EVENTS.map((name) => ({ name, count: 0, users: 0 })),
    dailyTrend: [],
  }
}
