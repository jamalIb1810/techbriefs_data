import { type NextRequest, NextResponse } from "next/server"
import { getGA4Client, getDateRange } from "@/lib/ga4-client"
import { mockSocialMediaData } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get("timeRange") || "7d"
    const propertyId = process.env.GA4_PROPERTY_ID

    console.log("[v0] Fetching social media analytics for time range:", timeRange)

    const analyticsData = getGA4Client()

    // If GA4 is not configured, return mock data
    if (!analyticsData || !propertyId) {
      console.log("[v0] GA4 not configured, returning mock social data")
      return NextResponse.json({
        success: true,
        data: mockSocialMediaData,
        source: "mock",
      })
    }

    const { startDate, endDate } = getDateRange(timeRange)

    const response = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }, { name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [{ name: "sessions" }, { name: "engagedSessions" }],
        dimensionFilter: {
          orGroup: {
            expressions: [
              {
                filter: {
                  fieldName: "sessionMedium",
                  stringFilter: {
                    matchType: "EXACT",
                    value: "social",
                  },
                },
              },
              {
                filter: {
                  fieldName: "sessionSource",
                  inListFilter: {
                    values: [
                      "facebook.com",
                      "facebook",
                      "fb",
                      "linkedin.com",
                      "linkedin",
                      "pinterest.com",
                      "pinterest",
                      "x.com",
                      "twitter.com",
                      "twitter",
                      "t.co",
                      "instagram.com",
                      "instagram",
                    ],
                  },
                },
              },
            ],
          },
        },
        orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
      },
    })

    console.log("[v0] GA4 Social Response:", JSON.stringify(response.data, null, 2))

    // Transform GA4 data to match our social media format
    const socialDataMap = new Map<string, any>()

    response.data.rows?.forEach((row) => {
      const date = row.dimensionValues?.[0]?.value || ""
      const source = (row.dimensionValues?.[1]?.value || "").toLowerCase()
      const sessions = Number.parseInt(row.metricValues?.[0]?.value || "0")

      console.log("[v0] Processing row - Date:", date, "Source:", source, "Sessions:", sessions)

      let normalizedSource = ""
      if (source.includes("facebook") || source.includes("fb")) {
        normalizedSource = "facebook"
      } else if (source.includes("linkedin")) {
        normalizedSource = "linkedin"
      } else if (source.includes("pinterest")) {
        normalizedSource = "pinterest"
      } else if (source.includes("x.com") || source.includes("twitter") || source.includes("t.co")) {
        normalizedSource = "x.com"
      } else if (source.includes("instagram")) {
        normalizedSource = "instagram"
      } else {
        console.log("[v0] Skipping unknown source:", source)
        return // Skip unknown sources
      }

      if (!socialDataMap.has(date)) {
        socialDataMap.set(date, {
          date,
          facebook: 0,
          linkedin: 0,
          pinterest: 0,
          "x.com": 0,
          instagram: 0,
        })
      }

      const dayData = socialDataMap.get(date)
      if (dayData && normalizedSource in dayData) {
        dayData[normalizedSource] += sessions
      }
    })

    const chartData = Array.from(socialDataMap.values())

    console.log("[v0] Final social chart data:", JSON.stringify(chartData, null, 2))
    console.log("[v0] Total data points:", chartData.length)

    if (chartData.length === 0) {
      console.log("[v0] No social media traffic found in GA4 data")
      return NextResponse.json({
        success: true,
        data: [],
        source: "ga4",
        message: "No social media traffic found in the selected time range",
      })
    }

    return NextResponse.json({
      success: true,
      data: chartData,
      source: "ga4",
    })
  } catch (error) {
    console.error("[v0] Error fetching GA4 social data:", error)
    // Return empty data on error to show real state
    return NextResponse.json({
      success: false,
      data: [],
      source: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
