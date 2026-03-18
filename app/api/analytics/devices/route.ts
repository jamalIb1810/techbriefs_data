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
      devices: [],
      browsers: [],
      operatingSystems: [],
      screenResolutions: [],
      deviceCategories: [],
    })
  }

  try {
    const credentials = JSON.parse(serviceAccountKey)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    })

    const analyticsData = google.analyticsdata({ version: "v1beta", auth })

    // Fetch device categories (desktop, mobile, tablet)
    const deviceCategoryResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
          { name: "engagementRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      },
    })

    // Fetch browsers
    const browserResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "browser" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 15,
      },
    })

    // Fetch operating systems
    const osResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "operatingSystem" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 15,
      },
    })

    // Fetch screen resolutions
    const screenResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "screenResolution" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 15,
      },
    })

    // Fetch device brands (mobile)
    const brandResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "mobileDeviceBranding" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 15,
      },
    })

    // Fetch device models
    const modelResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "mobileDeviceModel" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 20,
      },
    })

    // Fetch OS versions
    const osVersionResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "operatingSystem" }, { name: "operatingSystemVersion" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 20,
      },
    })

    // Fetch browser versions
    const browserVersionResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "browser" }, { name: "browserVersion" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 20,
      },
    })

    // Process device categories
    const deviceCategories = (deviceCategoryResponse.data.rows || []).map((row) => ({
      category: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
      avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0"),
      bounceRate: parseFloat(row.metricValues?.[4]?.value || "0") * 100,
      engagementRate: parseFloat(row.metricValues?.[5]?.value || "0") * 100,
    }))

    // Process browsers
    const browsers = (browserResponse.data.rows || []).map((row) => ({
      browser: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
      avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0"),
      bounceRate: parseFloat(row.metricValues?.[4]?.value || "0") * 100,
    }))

    // Process operating systems
    const operatingSystems = (osResponse.data.rows || []).map((row) => ({
      os: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
      avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0"),
      bounceRate: parseFloat(row.metricValues?.[4]?.value || "0") * 100,
    }))

    // Process screen resolutions
    const screenResolutions = (screenResponse.data.rows || []).map((row) => ({
      resolution: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
    }))

    // Process device brands
    const deviceBrands = (brandResponse.data.rows || [])
      .filter((row) => row.dimensionValues?.[0]?.value && row.dimensionValues[0].value !== "(not set)")
      .map((row) => ({
        brand: row.dimensionValues?.[0]?.value || "Unknown",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
      }))

    // Process device models
    const deviceModels = (modelResponse.data.rows || [])
      .filter((row) => row.dimensionValues?.[0]?.value && row.dimensionValues[0].value !== "(not set)")
      .map((row) => ({
        model: row.dimensionValues?.[0]?.value || "Unknown",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
      }))

    // Process OS versions
    const osVersions = (osVersionResponse.data.rows || []).map((row) => ({
      os: row.dimensionValues?.[0]?.value || "Unknown",
      version: row.dimensionValues?.[1]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
    }))

    // Process browser versions
    const browserVersions = (browserVersionResponse.data.rows || []).map((row) => ({
      browser: row.dimensionValues?.[0]?.value || "Unknown",
      version: row.dimensionValues?.[1]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
    }))

    // Calculate totals
    const totalSessions = deviceCategories.reduce((sum, d) => sum + d.sessions, 0)
    const totalUsers = deviceCategories.reduce((sum, d) => sum + d.users, 0)

    return NextResponse.json({
      source: "ga4",
      dateRange: { startDate, endDate },
      summary: {
        totalSessions,
        totalUsers,
        mobileShare: totalSessions > 0 
          ? ((deviceCategories.find(d => d.category === "mobile")?.sessions || 0) / totalSessions * 100).toFixed(1)
          : 0,
        desktopShare: totalSessions > 0
          ? ((deviceCategories.find(d => d.category === "desktop")?.sessions || 0) / totalSessions * 100).toFixed(1)
          : 0,
        tabletShare: totalSessions > 0
          ? ((deviceCategories.find(d => d.category === "tablet")?.sessions || 0) / totalSessions * 100).toFixed(1)
          : 0,
      },
      deviceCategories,
      browsers,
      operatingSystems,
      screenResolutions,
      deviceBrands,
      deviceModels,
      osVersions,
      browserVersions,
    })
  } catch (error: any) {
    console.error("[v0] GA4 devices API error:", error?.message)
    return NextResponse.json({
      source: "mock",
      error: error?.message,
      dateRange: { startDate, endDate },
      deviceCategories: [],
      browsers: [],
      operatingSystems: [],
      screenResolutions: [],
      deviceBrands: [],
      deviceModels: [],
      osVersions: [],
      browserVersions: [],
    })
  }
}
