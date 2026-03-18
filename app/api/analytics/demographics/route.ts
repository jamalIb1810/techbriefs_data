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
      countries: [],
      cities: [],
      languages: [],
    })
  }

  try {
    const credentials = JSON.parse(serviceAccountKey)
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    })

    const analyticsData = google.analyticsdata({ version: "v1beta", auth })

    // Fetch countries
    const countryResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "country" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "engagementRate" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 30,
      },
    })

    // Fetch cities
    const cityResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "city" }, { name: "country" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 30,
      },
    })

    // Fetch regions/states
    const regionResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "region" }, { name: "country" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 30,
      },
    })

    // Fetch languages
    const languageResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "language" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 20,
      },
    })

    // Fetch continents
    const continentResponse = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "continent" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
        ],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      },
    })

    // Process countries
    const countries = (countryResponse.data.rows || []).map((row) => ({
      country: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
      avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || "0"),
      engagementRate: parseFloat(row.metricValues?.[4]?.value || "0") * 100,
      bounceRate: parseFloat(row.metricValues?.[5]?.value || "0") * 100,
    }))

    // Process cities
    const cities = (cityResponse.data.rows || [])
      .filter((row) => row.dimensionValues?.[0]?.value && row.dimensionValues[0].value !== "(not set)")
      .map((row) => ({
        city: row.dimensionValues?.[0]?.value || "Unknown",
        country: row.dimensionValues?.[1]?.value || "Unknown",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
        pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
      }))

    // Process regions
    const regions = (regionResponse.data.rows || [])
      .filter((row) => row.dimensionValues?.[0]?.value && row.dimensionValues[0].value !== "(not set)")
      .map((row) => ({
        region: row.dimensionValues?.[0]?.value || "Unknown",
        country: row.dimensionValues?.[1]?.value || "Unknown",
        sessions: parseInt(row.metricValues?.[0]?.value || "0"),
        users: parseInt(row.metricValues?.[1]?.value || "0"),
      }))

    // Process languages
    const languages = (languageResponse.data.rows || []).map((row) => ({
      language: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
      pageViews: parseInt(row.metricValues?.[2]?.value || "0"),
    }))

    // Process continents
    const continents = (continentResponse.data.rows || []).map((row) => ({
      continent: row.dimensionValues?.[0]?.value || "Unknown",
      sessions: parseInt(row.metricValues?.[0]?.value || "0"),
      users: parseInt(row.metricValues?.[1]?.value || "0"),
    }))

    // Calculate totals
    const totalSessions = countries.reduce((sum, c) => sum + c.sessions, 0)
    const totalUsers = countries.reduce((sum, c) => sum + c.users, 0)
    const uniqueCountries = countries.length
    const uniqueCities = cities.length

    return NextResponse.json({
      source: "ga4",
      dateRange: { startDate, endDate },
      summary: {
        totalSessions,
        totalUsers,
        uniqueCountries,
        uniqueCities,
        topCountry: countries[0]?.country || "N/A",
        topCity: cities[0]?.city || "N/A",
      },
      countries,
      cities,
      regions,
      languages,
      continents,
    })
  } catch (error: any) {
    console.error("[v0] GA4 demographics API error:", error?.message)
    return NextResponse.json({
      source: "mock",
      error: error?.message,
      dateRange: { startDate, endDate },
      countries: [],
      cities: [],
      regions: [],
      languages: [],
      continents: [],
    })
  }
}
