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
    // 1. Fetch total event counts per event name
    const eventCountsResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "eventName" }],
        metrics: [
          { name: "eventCount" },
          { name: "totalUsers" },
        ],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: {
              values: CHATBOT_EVENTS,
            },
          },
        },
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      },
    })

    // 2. Fetch daily trend for key events
    const trendResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }, { name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            inListFilter: {
              values: ["chat_opened", "chat_message_sent", "chat_error"],
            },
          },
        },
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
    })

    // 3. Fetch mode selected breakdown (custom dimension: chat_mode)
    const modeResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "eventName" }, { name: "customEvent:chat_mode" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: {
          filter: {
            fieldName: "eventName",
            stringFilter: { value: "chat_mode_selected", matchType: "EXACT" },
          },
        },
      },
    })

    // Debug: log raw GA4 response
    console.log("[v0] Chatbot date range:", startDate, "→", endDate)
    console.log("[v0] Chatbot raw rows:", JSON.stringify(eventCountsResponse.data.rows || [], null, 2))

    // Process event counts
    const eventTotals: Record<string, { count: number; users: number }> = {}
    for (const row of eventCountsResponse.data.rows || []) {
      const name = row.dimensionValues?.[0]?.value || ""
      eventTotals[name] = {
        count: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
      }
    }

    // Process daily trend
    const trendMap: Record<string, Record<string, number>> = {}
    for (const row of trendResponse.data.rows || []) {
      const date = row.dimensionValues?.[0]?.value || ""
      const event = row.dimensionValues?.[1]?.value || ""
      const count = parseInt(row.metricValues?.[0]?.value || "0")
      if (!trendMap[date]) trendMap[date] = {}
      trendMap[date][event] = count
    }

    const dailyTrend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, events]) => ({
        date,
        chat_opened: events["chat_opened"] || 0,
        chat_message_sent: events["chat_message_sent"] || 0,
        chat_error: events["chat_error"] || 0,
      }))

    // Process mode breakdown
    const modeBreakdown: Record<string, number> = {}
    for (const row of modeResponse.data.rows || []) {
      const mode = row.dimensionValues?.[1]?.value || "(not set)"
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + parseInt(row.metricValues?.[0]?.value || "0")
    }

    // Build per-event summary
    const events = CHATBOT_EVENTS.map((name) => ({
      name,
      count: eventTotals[name]?.count || 0,
      users: eventTotals[name]?.users || 0,
    }))

    const totalOpened = eventTotals["chat_opened"]?.count || 0
    const totalSent = eventTotals["chat_message_sent"]?.count || 0
    const totalErrors = eventTotals["chat_error"]?.count || 0
    const totalCTAClicks = eventTotals["chat_cta_clicked"]?.count || 0
    const totalArticleClicks = eventTotals["chat_article_clicked"]?.count || 0

    return NextResponse.json({
      source: "ga4",
      dateRange: { startDate, endDate },
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
