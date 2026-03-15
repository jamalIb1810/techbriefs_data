# Ask TechBriefs — Chatbot Analytics API

## Overview

`GET /api/analytics/chatbot`

Returns analytics data for the **Ask TechBriefs** AI chatbot widget, sourced from Google Analytics 4 custom events. It covers session activity, message volume, error rates, mode distribution, and a daily trend breakdown.

---

## Query Parameters

| Parameter   | Type   | Default | Description                                      |
|-------------|--------|---------|--------------------------------------------------|
| `timeRange` | string | `7d`    | Time range key. See supported values below.      |

### Supported `timeRange` Values

| Value        | Description             |
|--------------|-------------------------|
| `today`      | Today only              |
| `yesterday`  | Yesterday only          |
| `7d`         | Last 7 days             |
| `14d`        | Last 14 days            |
| `30d`        | Last 30 days            |
| `60d`        | Last 60 days            |
| `90d`        | Last 90 days            |
| `6m`         | Last 6 months           |
| `1y`         | Last 12 months          |
| `thisMonth`  | Current calendar month  |
| `lastMonth`  | Previous calendar month |
| `thisYear`   | Year to date            |

---

## Tracked GA4 Events

These events must be implemented in your chatbot widget and sent to Google Analytics 4 via `gtag()` or the Measurement Protocol.

| Event Name             | When It Fires                                       |
|------------------------|-----------------------------------------------------|
| `chat_opened`          | User opens the chatbot widget                       |
| `chat_closed`          | User closes the chatbot widget                      |
| `chat_mode_selected`   | User selects a mode (e.g. "ask", "search")          |
| `chat_message_sent`    | User sends a message                                |
| `chat_article_clicked` | User clicks an article link inside the chatbot      |
| `chat_cta_clicked`     | User clicks a call-to-action button inside the chat |
| `chat_error`           | An error occurs during the chat interaction         |

### Recommended Event Parameters

For `chat_mode_selected`, send a custom parameter `chat_mode` so the dashboard can break down mode usage:

```js
gtag("event", "chat_mode_selected", {
  chat_mode: "ask", // or "search", "recommend", etc.
})
```

For `chat_article_clicked`, optionally send `article_slug` and `article_title`:

```js
gtag("event", "chat_article_clicked", {
  article_slug: "/blog/ai/best-tools-2025",
  article_title: "Best AI Tools in 2025",
})
```

---

## Response Structure

```json
{
  "source": "ga4",
  "dateRange": {
    "startDate": "2026-01-03",
    "endDate": "2026-01-09"
  },
  "summary": {
    "totalSessions": 210,
    "totalMessages": 874,
    "avgMessagesPerSession": 4.2,
    "errorRate": 1.8,
    "ctaClickRate": 12.4,
    "articleClickRate": 23.7
  },
  "events": [
    { "name": "chat_opened", "count": 210, "users": 185 },
    { "name": "chat_message_sent", "count": 874, "users": 185 },
    { "name": "chat_closed", "count": 198, "users": 180 },
    { "name": "chat_mode_selected", "count": 156, "users": 140 },
    { "name": "chat_article_clicked", "count": 98, "users": 87 },
    { "name": "chat_cta_clicked", "count": 52, "users": 49 },
    { "name": "chat_error", "count": 16, "users": 14 }
  ],
  "dailyTrend": [
    {
      "date": "20260103",
      "chat_opened": 28,
      "chat_message_sent": 112,
      "chat_error": 2
    }
  ],
  "modeBreakdown": {
    "ask": 89,
    "search": 67
  }
}
```

### Field Descriptions

#### `source`
- `"ga4"` — live data from Google Analytics 4
- `"mock"` — fallback data used when GA4 is not configured

#### `summary`

| Field                  | Description                                                         |
|------------------------|---------------------------------------------------------------------|
| `totalSessions`        | Total number of `chat_opened` events (unique chat sessions started) |
| `totalMessages`        | Total `chat_message_sent` events                                    |
| `avgMessagesPerSession`| `totalMessages / totalSessions`, rounded to 1 decimal              |
| `errorRate`            | `(chat_error / chat_message_sent) * 100`, as a percentage           |
| `ctaClickRate`         | `(chat_cta_clicked / chat_opened) * 100`, as a percentage           |
| `articleClickRate`     | `(chat_article_clicked / chat_opened) * 100`, as a percentage       |

#### `events`
Array of all 7 tracked events with:
- `count` — total event fires in the period
- `users` — number of unique users who triggered the event

#### `dailyTrend`
Daily breakdown of the three most activity-relevant events:
- `chat_opened` — sessions started per day
- `chat_message_sent` — messages sent per day
- `chat_error` — errors per day

Dates are in GA4 format: `YYYYMMDD` (e.g. `"20260103"`). The dashboard parses these automatically.

#### `modeBreakdown`
A map of `chat_mode` custom parameter values to event counts from `chat_mode_selected`. Used to render the mode distribution pie chart.

---

## How the API Works Internally

```
Request → getDateRange(timeRange)
        → getGA4Client() [service account auth]
        → runReport #1: eventCount + totalUsers per eventName (filtered to 7 events)
        → runReport #2: daily trend for opened / sent / error
        → runReport #3: chat_mode_selected broken down by chat_mode dimension
        → Aggregate → Return JSON
```

Three separate GA4 `runReport` calls are made in parallel to keep response time low.

---

## Fallback / Mock Data

If `GA4_PROPERTY_ID` or `GA4_SERVICE_ACCOUNT_JSON` environment variables are missing, or if the GA4 API call fails, the endpoint returns mock data with `"source": "mock"` so the UI always renders correctly during development.

---

## Required Environment Variables

| Variable                  | Description                                             |
|---------------------------|---------------------------------------------------------|
| `GA4_PROPERTY_ID`         | Your GA4 numeric property ID (e.g. `503082749`)         |
| `GA4_SERVICE_ACCOUNT_JSON`| Full JSON string of your Google service account key     |

---

## Example Usage

```bash
# Last 7 days
GET /api/analytics/chatbot?timeRange=7d

# Last 30 days
GET /api/analytics/chatbot?timeRange=30d

# This month
GET /api/analytics/chatbot?timeRange=thisMonth
```

---

## Dashboard UI

The **Ask TechBriefs** tab in the admin dashboard renders:

1. **6 KPI cards** — sessions, messages, avg depth, error rate, CTA rate, article click rate
2. **Daily activity trend chart** — line or bar, switchable, showing opens / messages / errors
3. **Event breakdown table** — all 7 events sorted by count with share bar and user count
4. **Mode breakdown donut chart** — distribution of `chat_mode_selected` values
5. **Event reference grid** — human-readable description of every tracked event
