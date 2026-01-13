# Top Articles API Documentation

## Overview

The Top Articles API endpoint retrieves the 3 most-viewed articles from Google Analytics 4 for your TechBriefs blog. This endpoint is optimized for displaying featured or trending content on your dashboard.

## Endpoint

```
GET /api/analytics/top-articles
```

## Authentication

This endpoint runs server-side and uses the GA4 Service Account credentials configured in your environment variables. No client-side authentication is required.

## Required Environment Variables

| Variable | Description |
|----------|-------------|
| `GA4_PROPERTY_ID` | Your Google Analytics 4 Property ID (e.g., "503082749") |
| `GA4_SERVICE_ACCOUNT_JSON` | Service Account JSON credentials as a string |

## Query Parameters

### `timeRange` (optional)

Specifies the time period for analytics data.

**Type:** `string`  
**Default:** `"7d"`

**Available Options:**

| Value | Description | Example Date Range |
|-------|-------------|-------------------|
| `today` | Current day only | Jan 14, 2026 |
| `yesterday` | Previous day | Jan 13, 2026 |
| `7d` | Last 7 days | Jan 8 - Jan 14, 2026 |
| `14d` | Last 14 days | Jan 1 - Jan 14, 2026 |
| `30d` | Last 30 days | Dec 15, 2025 - Jan 14, 2026 |
| `60d` | Last 60 days | Nov 15, 2025 - Jan 14, 2026 |
| `90d` | Last 90 days | Oct 16, 2025 - Jan 14, 2026 |
| `6m` | Last 6 months | Jul 14, 2025 - Jan 14, 2026 |
| `1y` | Last 12 months | Jan 14, 2025 - Jan 14, 2026 |
| `thisMonth` | Current month to date | Jan 1 - Jan 14, 2026 |
| `lastMonth` | Previous complete month | Dec 1 - Dec 31, 2025 |
| `thisYear` | Current year to date | Jan 1 - Jan 14, 2026 |

**Example:**
```
GET /api/analytics/top-articles?timeRange=30d
```

## Response Format

### Success Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Getting Started with Next.js 15",
      "category": "Technology",
      "views": 1250,
      "clicks": 187,
      "engagement": 4.5,
      "date": "2026-01-14",
      "path": "/blog/technology/getting-started-nextjs-15",
      "bounceRate": 35.2,
      "activeUsers": 890
    },
    {
      "id": 2,
      "title": "Understanding React Server Components",
      "category": "Development",
      "views": 980,
      "clicks": 147,
      "engagement": 5.2,
      "date": "2026-01-14",
      "path": "/blog/development/react-server-components",
      "bounceRate": 28.4,
      "activeUsers": 720
    },
    {
      "id": 3,
      "title": "AI-Powered Analytics Dashboard Guide",
      "category": "Analytics",
      "views": 875,
      "clicks": 131,
      "engagement": 6.1,
      "date": "2026-01-14",
      "path": "/blog/analytics/ai-powered-dashboard-guide",
      "bounceRate": 31.8,
      "activeUsers": 650
    }
  ],
  "source": "ga4",
  "timeRange": {
    "startDate": "2026-01-08",
    "endDate": "2026-01-14"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `data` | array | Array of top 3 articles, ordered by views (descending) |
| `data[].id` | number | Sequential ID (1-3) |
| `data[].title` | string | Article page title from GA4 |
| `data[].category` | string | Extracted from URL path after `/blog/` |
| `data[].views` | number | Total page views (screenPageViews) |
| `data[].clicks` | number | Estimated clicks (15% of views) |
| `data[].engagement` | number | Average time on page in minutes |
| `data[].date` | string | End date of the analysis period (ISO format) |
| `data[].path` | string | URL path of the article |
| `data[].bounceRate` | number | Bounce rate as a percentage (0-100) |
| `data[].activeUsers` | number | Number of unique active users |
| `source` | string | Data source: `"ga4"` (real data) or `"mock"` (fallback) |
| `timeRange` | object | Actual date range used for the query |
| `timeRange.startDate` | string | Start date in YYYY-MM-DD format |
| `timeRange.endDate` | string | End date in YYYY-MM-DD format |

### Error Response

If GA4 is not configured or an error occurs, the API returns mock data with an error message:

```json
{
  "success": false,
  "data": [...], // Mock data array
  "source": "mock",
  "error": "Error message describing the issue",
  "timeRange": {
    "startDate": "2026-01-08",
    "endDate": "2026-01-14"
  }
}
```

## How It Works

### 1. Category Extraction

Categories are automatically extracted from the URL path structure. The API expects blog URLs in the format:

```
/blog/{category}/{article-slug}
```

**Examples:**
- `/blog/technology/nextjs-guide` → Category: "Technology"
- `/blog/machine-learning/intro-to-ai` → Category: "Machine Learning"
- `/blog/web-development/react-tips` → Category: "Web Development"

The category name is automatically capitalized and formatted (hyphens converted to spaces).

### 2. Metrics Calculation

#### Views
Direct from GA4 metric: `screenPageViews`

#### Clicks (Estimated)
```javascript
clicks = Math.floor(views * 0.15)
```
Assumes a 15% click-through rate.

#### Engagement
```javascript
engagement = averageSessionDuration / 60
```
Converts seconds to minutes, rounded to 1 decimal place.

#### Bounce Rate
```javascript
bounceRate = GA4_bounceRate * 100
```
Converts decimal to percentage (e.g., 0.352 → 35.2%).

### 3. Data Filtering

The API automatically filters to include only blog articles by applying a dimension filter:

```javascript
dimensionFilter: {
  filter: {
    fieldName: "pagePath",
    stringFilter: {
      matchType: "CONTAINS",
      value: "/blog/"
    }
  }
}
```

This ensures only URLs containing `/blog/` are included in results.

### 4. Sorting and Limiting

Articles are sorted by `screenPageViews` in descending order, and the API limits results to exactly 3 articles using GA4's built-in sorting and limiting:

```javascript
orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
limit: 3
```

### 5. Fallback Behavior

If GA4 credentials are missing or an error occurs:
1. The API logs the error to console
2. Returns mock data with realistic values
3. Sets `source: "mock"` in the response
4. Includes the error message in the response

## Usage Examples

### Fetch Top 3 Articles (Last 7 Days)

```javascript
const response = await fetch('/api/analytics/top-articles')
const data = await response.json()

if (data.success && data.source === 'ga4') {
  console.log('Top 3 articles:', data.data)
} else {
  console.log('Using mock data')
}
```

### Fetch Top 3 Articles (Last 30 Days)

```javascript
const response = await fetch('/api/analytics/top-articles?timeRange=30d')
const data = await response.json()

data.data.forEach((article, index) => {
  console.log(`#${index + 1}: ${article.title} - ${article.views} views`)
})
```

### React Component Example

```typescript
'use client'

import { useEffect, useState } from 'react'

export function TopArticlesWidget() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics/top-articles?timeRange=7d')
      .then(res => res.json())
      .then(data => {
        setArticles(data.data)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h2>Top Articles This Week</h2>
      {articles.map((article) => (
        <div key={article.id}>
          <h3>{article.title}</h3>
          <p>{article.views} views • {article.engagement} min read</p>
          <span>{article.category}</span>
        </div>
      ))}
    </div>
  )
}
```

## Debugging

The API includes extensive console logging for debugging:

```
[v0] Top Articles API - Fetching for time range: 30d
[v0] Top Articles API - Querying GA4 from 2025-12-15 to 2026-01-14
[v0] Top Articles API - GA4 returned 3 rows
[v0] Top Articles API - Processed articles: [
  { title: "Getting Started with Next.js 15", views: 1250 },
  { title: "Understanding React Server Components", views: 980 },
  { title: "AI-Powered Analytics Dashboard Guide", views: 875 }
]
```

Check your server console or browser Network tab to see these logs.

## Common Issues

### Issue: Returning Mock Data Instead of Real Data

**Cause:** GA4 environment variables not configured  
**Solution:** Verify `GA4_PROPERTY_ID` and `GA4_SERVICE_ACCOUNT_JSON` are set correctly

### Issue: No Articles Returned

**Cause:** No blog articles have `/blog/` in their URL path  
**Solution:** Ensure your blog URLs follow the `/blog/{category}/{slug}` structure

### Issue: Wrong Category Names

**Cause:** URL structure doesn't match expected format  
**Solution:** Check that your URLs are structured as `/blog/{category}/{slug}`

### Issue: Bounce Rate is 0

**Cause:** GA4 might not have collected enough data  
**Solution:** Wait for more traffic data to accumulate in GA4

## GA4 Metrics Reference

| GA4 Metric | API Field | Description |
|------------|-----------|-------------|
| `screenPageViews` | `views` | Total number of times the page was viewed |
| `averageSessionDuration` | `engagement` | Average time users spent on the page (converted to minutes) |
| `bounceRate` | `bounceRate` | Percentage of single-page sessions |
| `activeUsers` | `activeUsers` | Number of unique users who visited the page |

## Next Steps

- Use this API to create a "Trending Articles" widget
- Display top performers on your main dashboard
- Compare article performance across different time periods
- Build automated reports for content performance
