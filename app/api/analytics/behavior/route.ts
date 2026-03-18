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
      landingPages: [],
      exitPages: [],
      pagePerformance: [],
    })
  }

  try {
    const credentials = JSON.parse(serviceAccountKey)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    })

    const analyticsData = google.analyticsdata({ version: "v1beta", auth })

    // Fetch landing pages
    const landingResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "landingPage" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "newUsers" },
          { name: "bounceRate" },
          { name: "averageSessionDuration" },
          { name: "engagementRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 30,
      },
    })

    // Fetch page performance (all pages)
    const pageResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "totalUsers" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "engagementRate" },
          { name: "userEngagementDuration" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 50,
      },
    })

    // Fetch page titles with paths
    const pageTitleResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 50,
      },
    })

    // Fetch exit pages (pages where sessions end)
    const exitResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "exits" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "exits" }, desc: true }],
        limit: 30,
      },
    })

    // Fetch entrances per page
    const entranceResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "entrances" },
        ],
        orderBys: [{ metric: { metricName: "entrances" }, desc: true }],
        limit: 30,
      },
    })

    // Fetch user engagement by hour
    const hourlyResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "hour" }],
        metrics: [
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "totalUsers" },
        ],
        orderBys: [{ dimension: { dimensionName: "hour" } }],
      },
    })

    // Fetch user engagement by day of week
    const dayOfWeekResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "dayOfWeek" }],
        metrics: [
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "totalUsers" },
        ],
        orderBys: [{ dimension: { dimensionName: "dayOfWeek" } }],
      },
    })

    // Fetch new vs returning users
    const userTypeResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "newVsReturning" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
      },
    })

    // Process landing pages
    const landingPages = (landingResponse.data.rows || []).map((row) => ({
      page: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      newUsers: parseInt(row.metricValues?.[2]?.value || "0"),
      bounceRate: parseFloat(row.metricValues?.[3]?.value || "0") * 100,
      avgSessionDuration: parseFloat(row.metricValues?.[4]?.value || "0"),
      engagementRate: parseFloat(row.metricValues?.[5]?.value || "0") * 100,
    }))

    // Build page title map
    const pageTitleMap: Record<string, string> = {}
    for (const row of pageTitleResponse.data.rows || []) {
      const path = row.dimensionValues?.[0]?.value || ""
      const title = row.dimensionValues?.[1]?.value || ""
      if (path && title) pageTitleMap[path] = title
    }

    // Process page performance
    const pagePerformance = (pageResponse.data.rows || []).map((row) => {
      const path = row.dimensionValues?.[0]?.value || "Unknown"
      return {
        page: path,
        title: pageTitleMap[path] || path,
        pageViews: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
        avgTimeOnPage: parseFloat(row.metricValues?.[2]?.value || "0"),
        bounceRate: parseFloat(row.metricValues?.[3]?.value || "0") * 100,
        engagementRate: parseFloat(row.metricValues?.[4]?.value || "0") * 100,
        totalEngagementTime: parseFloat(row.metricValues?.[5]?.value || "0"),
      }
    })

    // Process exit pages
    const exitPages = (exitResponse.data.rows || []).map((row) => ({
      page: row.dimensionValues?.[0]?.value || "Unknown",
      pageViews: parseInt(row.metricValues?.[0]?.value || "0"),
      exits: parseInt(row.metricValues?.[1]?.value || "0"),
      users: parseInt(row.metricValues?.[2]?.value || "0"),
      exitRate: parseInt(row.metricValues?.[0]?.value || "0") > 0
        ? (parseInt(row.metricValues?.[1]?.value || "0") / parseInt(row.metricValues?.[0]?.value || "1") * 100)
        : 0,
    }))

    // Process entrances
    const entrancePages = (entranceResponse.data.rows || []).map((row) => ({
      page: row.dimensionValues?.[0]?.value || "Unknown",
      pageViews: parseInt(row.metricValues?.[0]?.value || "0"),
      entrances: parseInt(row.metricValues?.[1]?.value || "0"),
    }))

    // Process hourly data
    const hourlyData = (hourlyResponse.data.rows || []).map((row) => ({
      hour: parseInt(row.dimensionValues?.[0]?.value || "0"),
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[1]?.value || "0"),
      users: parseInt(row.metricValues?.[2]?.value || "0"),
    }))

    // Process day of week data
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const dayOfWeekData = (dayOfWeekResponse.data.rows || []).map((row) => ({
      dayIndex: parseInt(row.dimensionValues?.[0]?.value || "0"),
      day: dayNames[parseInt(row.dimensionValues?.[0]?.value || "0")] || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[1]?.value || "0"),
      users: parseInt(row.metricValues?.[2]?.value || "0"),
    }))

    // Process user types
    const userTypes = (userTypeResponse.data.rows || []).map((row) => ({
      type: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
      avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0"),
      bounceRate: parseFloat(row.metricValues?.[4]?.value || "0") * 100,
    }))

    // Calculate summary
    const totalPageViews = pagePerformance.reduce((sum, p) => sum + p.pageViews, 0)
    const totalSessions = landingPages.reduce((sum, p) => sum + p.sessions, 0)
    const avgBounceRate = landingPages.length > 0
      ? landingPages.reduce((sum, p) => sum + p.bounceRate, 0) / landingPages.length
      : 0

    return NextResponse.json({
      source: "ga4",
      dateRange: { startDate, endDate },
      summary: {
        totalPageViews,
        totalSessions,
        avgBounceRate: avgBounceRate.toFixed(1),
        topLandingPage: landingPages[0]?.page || "N/A",
        topExitPage: exitPages[0]?.page || "N/A",
        peakHour: hourlyData.reduce((max, h) => h.sessions > max.sessions ? h : max, hourlyData[0])?.hour || 0,
        peakDay: dayOfWeekData.reduce((max, d) => d.sessions > max.sessions ? d : max, dayOfWeekData[0])?.day || "N/A",
      },
      landingPages,
      exitPages,
      entrancePages,
      pagePerformance,
      hourlyData,
      dayOfWeekData,
      userTypes,
    })
  } catch (error: any) {
    console.error("[v0] GA4 behavior API error:", error?.message)
    return NextResponse.json({
      source: "mock",
      error: error?.message,
      dateRange: { startDate, endDate },
      landingPages: [],
      exitPages: [],
      pagePerformance: [],
      hourlyData: [],
      dayOfWeekData: [],
      userTypes: [],
    })
  }
}
