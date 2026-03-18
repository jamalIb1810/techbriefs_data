import { NextResponse } from "next/server"
import { google } from "googleapis"
import { getDateRange } from "@/lib/ga4-client"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const timeRange = searchParams.get("timeRange") || "7d"
  const { startDate, endDate } = getDateRange(timeRange)

  const propertyId = process.env.GA4_PROPERTY_ID
  const serviceAccountKey = process.env.GA4_SERVICE_ACCOUNT_KEY

  if (!propertyId || !serviceAccountKey) {
    return NextResponse.json({
      source: "mock",
      dateRange: { startDate, endDate },
      sources: [],
      mediums: [],
      campaigns: [],
    })
  }

  try {
    const credentials = JSON.parse(serviceAccountKey)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    })

    const analyticsData = google.analyticsdata({ version: "v1beta", auth })

    // Fetch source/medium combinations
    const sourceMediumResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "engagementRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 30,
      },
    })

    // Fetch default channel grouping
    const channelResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "engagementRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      },
    })

    // Fetch campaigns
    const campaignResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionCampaignName" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 20,
      },
    })

    // Fetch referrers
    const referrerResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pageReferrer" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 30,
      },
    })

    // Fetch first user source (acquisition)
    const acquisitionResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "firstUserSource" }, { name: "firstUserMedium" }],
        metrics: [
          { name: "newUsers" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "newUsers" }, desc: true }],
        limit: 20,
      },
    })

    // Process source/medium
    const sourceMedium = (sourceMediumResponse.data.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "Unknown",
      medium: row.dimensionValues?.[1]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      newUsers: parseInt(row.metricValues?.[2]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[3]?.value || "0"),
      avgSessionDuration: parseFloat(row.metricValues?.[4]?.value || "0"),
      bounceRate: parseFloat(row.metricValues?.[5]?.value || "0") * 100,
      engagementRate: parseFloat(row.metricValues?.[6]?.value || "0") * 100,
    }))

    // Process channels
    const channels = (channelResponse.data.rows || []).map((row) => ({
      channel: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      newUsers: parseInt(row.metricValues?.[2]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[3]?.value || "0"),
      avgSessionDuration: parseFloat(row.metricValues?.[4]?.value || "0"),
      bounceRate: parseFloat(row.metricValues?.[5]?.value || "0") * 100,
      engagementRate: parseFloat(row.metricValues?.[6]?.value || "0") * 100,
    }))

    // Process campaigns
    const campaigns = (campaignResponse.data.rows || [])
      .filter((row) => row.dimensionValues?.[0]?.value && row.dimensionValues[0].value !== "(not set)")
      .map((row) => ({
        campaign: row.dimensionValues?.[0]?.value || "Unknown",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
        pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
        bounceRate: parseFloat(row.metricValues?.[3]?.value || "0") * 100,
      }))

    // Process referrers
    const referrers = (referrerResponse.data.rows || [])
      .filter((row) => row.dimensionValues?.[0]?.value && row.dimensionValues[0].value !== "(not set)")
      .map((row) => {
        const url = row.dimensionValues?.[0]?.value || ""
        let domain = url
        try {
          domain = new URL(url).hostname
        } catch {
          domain = url.split("/")[0]
        }
        return {
          referrer: url,
          domain,
          sessions: parseInt(row.metricValues?.[0]?.value || "0"),
          users: parseInt(row.metricValues?.[1]?.value || "0"),
        }
      })

    // Process acquisition
    const acquisition = (acquisitionResponse.data.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || "Unknown",
      medium: row.dimensionValues?.[1]?.value || "Unknown",
      newUsers: parseInt(row.metricValues?.[0]?.value || "0"),
      totalUsers: parseInt(row.metricValues?.[1]?.value || "0"),
    }))

    // Calculate totals
    const totalSessions = sourceMedium.reduce((sum, s) => sum + s.sessions, 0)
    const totalUsers = sourceMedium.reduce((sum, s) => sum + s.users, 0)
    const totalNewUsers = sourceMedium.reduce((sum, s) => sum + s.newUsers, 0)

    return NextResponse.json({
      source: "ga4",
      dateRange: { startDate, endDate },
      summary: {
        totalSessions,
        totalUsers,
        totalNewUsers,
        newUserRate: totalUsers > 0 ? ((totalNewUsers / totalUsers) * 100).toFixed(1) : 0,
        topChannel: channels[0]?.channel || "N/A",
        topSource: sourceMedium[0]?.source || "N/A",
      },
      sourceMedium,
      channels,
      campaigns,
      referrers,
      acquisition,
    })
  } catch (error: any) {
    console.error("[v0] GA4 traffic API error:", error?.message)
    return NextResponse.json({
      source: "mock",
      error: error?.message,
      dateRange: { startDate, endDate },
      sourceMedium: [],
      channels: [],
      campaigns: [],
      referrers: [],
      acquisition: [],
    })
  }
}
