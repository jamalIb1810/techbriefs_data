import { google } from "googleapis"

// Initialize GA4 client with service account credentials
export function getGA4Client() {
  try {
    // Parse the service account JSON from environment variable
    const credentials = process.env.GA4_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.GA4_SERVICE_ACCOUNT_JSON) : null

    if (!credentials) {
      console.error("[v0] GA4_SERVICE_ACCOUNT_JSON not found, using mock data")
      return null
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    })

    return google.analyticsdata({
      version: "v1beta",
      auth,
    })
  } catch (error) {
    console.error("[v0] Error initializing GA4 client:", error)
    return null
  }
}

// Helper to format date for GA4 API
export function formatDateForGA4(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function getDateRange(timeRange: string): { startDate: string; endDate: string } {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let startDate = new Date()
  let endDate = new Date()

  switch (timeRange) {
    case "today":
      startDate = new Date(today)
      endDate = new Date(today)
      break

    case "yesterday":
      startDate = new Date(yesterday)
      endDate = new Date(yesterday)
      break

    case "7d":
      endDate = new Date(yesterday)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 6) // 7 days including end date
      break

    case "14d":
      endDate = new Date(yesterday)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 13)
      break

    case "30d":
      endDate = new Date(yesterday)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 29)
      break

    case "60d":
      endDate = new Date(yesterday)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 59)
      break

    case "90d":
      endDate = new Date(yesterday)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 89)
      break

    case "6m":
      endDate = new Date(yesterday)
      startDate = new Date(endDate)
      startDate.setMonth(endDate.getMonth() - 6)
      break

    case "1y":
      endDate = new Date(yesterday)
      startDate = new Date(endDate)
      startDate.setFullYear(endDate.getFullYear() - 1)
      break

    case "thisMonth":
      endDate = new Date(yesterday)
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break

    case "lastMonth":
      endDate = new Date(today.getFullYear(), today.getMonth(), 0) // Last day of previous month
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1) // First day of previous month
      break

    case "thisYear":
      endDate = new Date(yesterday)
      startDate = new Date(today.getFullYear(), 0, 1) // January 1st of current year
      break

    default:
      // Default to last 7 days
      endDate = new Date(yesterday)
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 6)
  }

  return {
    startDate: formatDateForGA4(startDate),
    endDate: formatDateForGA4(endDate),
  }
}
