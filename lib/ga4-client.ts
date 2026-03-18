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

// Alias for getGA4Client for consistency across routes
export function getAnalytics() {
  return getGA4Client()
}

// Helper to format date for GA4 API
export function formatDateForGA4(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function getDateRange(timeRange: string): { startDate: string; endDate: string } {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Always use today as endDate so live/same-day events are included
  const endDate = new Date(today)
  let startDate = new Date(today)

  switch (timeRange) {
    case "today":
      startDate = new Date(today)
      break

    case "yesterday":
      return {
        startDate: formatDateForGA4(yesterday),
        endDate: formatDateForGA4(yesterday),
      }

    case "7d":
      startDate.setDate(today.getDate() - 6)
      break

    case "14d":
      startDate.setDate(today.getDate() - 13)
      break

    case "30d":
      startDate.setDate(today.getDate() - 29)
      break

    case "60d":
      startDate.setDate(today.getDate() - 59)
      break

    case "90d":
      startDate.setDate(today.getDate() - 89)
      break

    case "6m":
      startDate.setMonth(today.getMonth() - 6)
      break

    case "1y":
      startDate.setFullYear(today.getFullYear() - 1)
      break

    case "thisMonth":
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break

    case "lastMonth":
      return {
        startDate: formatDateForGA4(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        endDate: formatDateForGA4(new Date(today.getFullYear(), today.getMonth(), 0)),
      }

    case "thisYear":
      startDate = new Date(today.getFullYear(), 0, 1)
      break

    default:
      startDate.setDate(today.getDate() - 6)
  }

  return {
    startDate: formatDateForGA4(startDate),
    endDate: formatDateForGA4(endDate),
  }
}
