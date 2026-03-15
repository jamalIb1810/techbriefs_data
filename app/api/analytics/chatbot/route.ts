import { NextResponse } from "next/server"
import { getGA4Client, getDateRange } from "@/lib/ga4-client"

const CHATBOT_EVENTS = [
  "chat_opened",
  "chat_closed",
  "chat_mode_selected",
  "chat_message_sent",
  "chat_article_clicked",
  "chat_cta_clicked",
  "chat_error",
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get("timeRange") || "7d"
  const propertyId = process.env.GA4_PROPERTY_ID

  const { startDate, endDate } = getDateRange(timeRange)

  if (!propertyId) {
    return NextResponse.json(mockChatbotData(startDate, endDate))
  }

  const analyticsData = getGA4Client()
  if (!analyticsData) {
    return NextResponse.json(mockChatbotData(startDate, endDate))
  }

  try {
    // 1. Fetch ALL event counts with NO filter — then filter client-side.
    //    Using inListFilter on custom events can silently return 0 rows in GA4
    //    if the events haven't been marked as "key events" or are still processing.
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

    // 2. Fetch daily trend with NO filter, filter client-side after
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

    // Log all event names GA4 returned so we can verify exact names
    const allEventNames = (eventCountsResponse.data.rows || []).map(
      (r) => r.dimensionValues?.[0]?.value
    )
    console.log("[v0] Chatbot date range:", startDate, "→", endDate)
    console.log("[v0] ALL events returned by GA4:", allEventNames)

    // Process event counts — match against our list (case-insensitive trim)
    const eventTotals: Record<string, { count: number; users: number }> = {}
    for (const row of eventCountsResponse.data.rows || []) {
      const name = (row.dimensionValues?.[0]?.value || "").trim()
      eventTotals[name] = {
        count: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
      }
    }

    // Process daily trend — only keep chatbot-relevant events
    const TREND_EVENTS = new Set(["chat_opened", "chat_message_sent", "chat_error"])
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
        chat_opened: evs["chat_opened"] || 0,
        chat_message_sent: evs["chat_message_sent"] || 0,
        chat_error: evs["chat_error"] || 0,
      }))

    // Mode breakdown — derive from mode_selected count (no custom dimension needed)
    const modeBreakdown: Record<string, number> = {
      chat_mode_selected: eventTotals["chat_mode_selected"]?.count || 0,
    }

    // Build per-event summary
    const events = CHATBOT_EVENTS.map((name) => ({
      name,
      count: eventTotals[name]?.count || 0,
      users: eventTotals[name]?.users || 0,
    }))

    // Expose all GA4 event names in response so debug panel can show them
    const allReturnedEvents = allEventNames.filter(Boolean) as string[]

    const totalOpened = eventTotals["chat_opened"]?.count || 0
    const totalSent = eventTotals["chat_message_sent"]?.count || 0
    const totalErrors = eventTotals["chat_error"]?.count || 0
    const totalCTAClicks = eventTotals["chat_cta_clicked"]?.count || 0
    const totalArticleClicks = eventTotals["chat_article_clicked"]?.count || 0

    return NextResponse.json({
      source: "ga4",
      dateRange: { startDate, endDate },
      allReturnedEvents,
      summary: {
        totalSessions: totalOpened,
        totalMessages: totalSent,
        avgMessagesPerSession: totalOpened > 0 ? +(totalSent / totalOpened).toFixed(1) : 0,
        errorRate: totalSent > 0 ? +((totalErrors / totalSent) * 100).toFixed(1) : 0,
        ctaClickRate: totalOpened > 0 ? +((totalCTAClicks / totalOpened) * 100).toFixed(1) : 0,
        articleClickRate: totalOpened > 0 ? +((totalArticleClicks / totalOpened) * 100).toFixed(1) : 0,
      },
      events,
      dailyTrend,
      modeBreakdown,
    })
  } catch (error: any) {
    const errMsg = error?.message || "Unknown error"
    console.error("[v0] GA4 chatbot API error:", errMsg)
    return NextResponse.json({
      ...mockChatbotData(startDate, endDate),
      error: errMsg,
    })
  }
}

function mockChatbotData(startDate: string, endDate: string) {
  return {
    source: "mock",
    dateRange: { startDate, endDate },
    summary: {
      totalSessions: 0,
      totalMessages: 0,
      avgMessagesPerSession: 0,
      errorRate: 0,
      ctaClickRate: 0,
      articleClickRate: 0,
    },
    events: CHATBOT_EVENTS.map((name) => ({ name, count: 0, users: 0 })),
    dailyTrend: [],
    modeBreakdown: {},
  }
}
