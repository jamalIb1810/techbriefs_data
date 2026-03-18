import { NextResponse } from "next/server"
import { getGA4Client, getDateRange } from "@/lib/ga4-client"

// All engagement event names tracked in GA4
const ENGAGEMENT_EVENTS = [
  // Comments
  "comment_post",
  "comment_reply",
  // Articles
  "article_reaction",
  "article_save",
  "article_unsave",
  "article_summarized",
  // Newsletter
  "newsletter_subscribe",
  "newsletter_unsubscribe",
  // Reviews
  "review_submit",
  "review_edit",
  "review_delete",
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
        limit: 200,
      },
    })

    // Fetch daily trend for ALL engagement events
    const trendResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }, { name: "eventName" }],
        metrics: [{ name: "eventCount" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: 2000,
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

    // Process daily trend for engagement events
    const ENGAGEMENT_SET = new Set(ENGAGEMENT_EVENTS)
    const trendMap: Record<string, Record<string, number>> = {}
    for (const row of trendResponse.data.rows || []) {
      const date = row.dimensionValues?.[0]?.value || ""
      const event = (row.dimensionValues?.[1]?.value || "").trim()
      if (!ENGAGEMENT_SET.has(event)) continue
      const count = parseInt(row.metricValues?.[0]?.value || "0")
      if (!trendMap[date]) trendMap[date] = {}
      trendMap[date][event] = count
    }

    const dailyTrend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, evs]) => ({
        date,
        comment_post: evs["comment_post"] || 0,
        comment_reply: evs["comment_reply"] || 0,
        article_reaction: evs["article_reaction"] || 0,
        article_save: evs["article_save"] || 0,
        article_unsave: evs["article_unsave"] || 0,
        article_summarized: evs["article_summarized"] || 0,
        newsletter_subscribe: evs["newsletter_subscribe"] || 0,
        newsletter_unsubscribe: evs["newsletter_unsubscribe"] || 0,
        review_submit: evs["review_submit"] || 0,
        review_edit: evs["review_edit"] || 0,
        review_delete: evs["review_delete"] || 0,
      }))

    // Build per-event summary
    const events = ENGAGEMENT_EVENTS.map((name) => ({
      name,
      count: eventTotals[name]?.count || 0,
      users: eventTotals[name]?.users || 0,
    }))

    // Computed totals
    const allReturnedEvents = allEventNames.filter(Boolean) as string[]
    const totalComments = (eventTotals["comment_post"]?.count || 0) + (eventTotals["comment_reply"]?.count || 0)
    const totalReactions = eventTotals["article_reaction"]?.count || 0
    const totalSaves = eventTotals["article_save"]?.count || 0
    const totalUnsaves = eventTotals["article_unsave"]?.count || 0
    const netSaves = totalSaves - totalUnsaves
    const totalSummarized = eventTotals["article_summarized"]?.count || 0
    const totalSubscribes = eventTotals["newsletter_subscribe"]?.count || 0
    const totalUnsubscribes = eventTotals["newsletter_unsubscribe"]?.count || 0
    const totalReviewSubmits = eventTotals["review_submit"]?.count || 0
    const totalReviewEdits = eventTotals["review_edit"]?.count || 0
    const totalReviewDeletes = eventTotals["review_delete"]?.count || 0
    const totalReviews = totalReviewSubmits + totalReviewEdits + totalReviewDeletes

    // Save retention rate: saves that were NOT unsaved
    const saveRetention = totalSaves > 0 ? ((totalSaves - totalUnsaves) / totalSaves * 100) : 0
    // Comment depth ratio: replies per original post
    const commentPosts = eventTotals["comment_post"]?.count || 0
    const commentReplies = eventTotals["comment_reply"]?.count || 0
    const replyRatio = commentPosts > 0 ? +(commentReplies / commentPosts).toFixed(2) : 0
    // Review edit rate: how often reviews get edited after submission
    const reviewEditRate = totalReviewSubmits > 0 ? +((totalReviewEdits / totalReviewSubmits) * 100).toFixed(1) : 0
    // Review retention: submitted minus deleted
    const reviewRetention = totalReviewSubmits > 0 ? +(((totalReviewSubmits - totalReviewDeletes) / totalReviewSubmits) * 100).toFixed(1) : 100

    return NextResponse.json({
      source: "ga4",
      dateRange: { startDate, endDate },
      allReturnedEvents,
      summary: {
        totalComments,
        commentPosts,
        commentReplies,
        replyRatio,
        totalReactions,
        totalSaves,
        totalUnsaves,
        netSaves,
        saveRetention: +saveRetention.toFixed(1),
        totalSummarized,
        netSubscribers: totalSubscribes - totalUnsubscribes,
        totalSubscribes,
        totalUnsubscribes,
        totalReviews,
        totalReviewSubmits,
        totalReviewEdits,
        totalReviewDeletes,
        reviewEditRate,
        reviewRetention,
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
      commentPosts: 0,
      commentReplies: 0,
      replyRatio: 0,
      totalReactions: 0,
      totalSaves: 0,
      totalUnsaves: 0,
      netSaves: 0,
      saveRetention: 0,
      totalSummarized: 0,
      netSubscribers: 0,
      totalSubscribes: 0,
      totalUnsubscribes: 0,
      totalReviews: 0,
      totalReviewSubmits: 0,
      totalReviewEdits: 0,
      totalReviewDeletes: 0,
      reviewEditRate: 0,
      reviewRetention: 100,
    },
    events: ENGAGEMENT_EVENTS.map((name) => ({ name, count: 0, users: 0 })),
    dailyTrend: [],
  }
}
