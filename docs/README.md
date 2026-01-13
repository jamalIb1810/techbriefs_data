# TechBriefs Admin Analytics - API Documentation

Welcome to the TechBriefs Admin Analytics API documentation.

## Available APIs

### Analytics APIs

1. **[Top Articles API](./TOP_ARTICLES_API.md)** - Get the top 3 most-viewed articles
   - Endpoint: `GET /api/analytics/top-articles`
   - Returns the 3 best-performing blog articles by page views
   - Supports custom time ranges (today, 7d, 30d, etc.)
   - Automatically extracts categories from URL paths

2. **Overview API** - Get overall analytics metrics
   - Endpoint: `GET /api/analytics/overview`
   - Returns total views, clicks, engagement, and trend data

3. **Pages API** - Get all page analytics
   - Endpoint: `GET /api/analytics/pages`
   - Returns analytics for all blog pages

4. **Categories API** - Get category breakdowns
   - Endpoint: `GET /api/analytics/categories`
   - Returns performance metrics grouped by category

5. **Social Media API** - Get social media traffic
   - Endpoint: `GET /api/analytics/social`
   - Returns traffic from Facebook, LinkedIn, Pinterest, X.com, Instagram

### Authentication APIs

1. **Login API** - Server action for authentication
   - Validates credentials against environment variables
   - Returns success/error status

## Environment Variables

All APIs require these environment variables to be configured:

```bash
# Google Analytics 4
GA4_PROPERTY_ID=your-property-id
GA4_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Admin Authentication
ADMIN_EMAIL=your-email@example.com
ADMIN_PASSWORD=your-secure-password
```

## Quick Start

1. Set up your environment variables
2. The APIs automatically fall back to mock data if GA4 is not configured
3. All responses include a `source` field indicating `"ga4"` or `"mock"`

## Common Query Parameters

Most analytics APIs support these query parameters:

- `timeRange`: Time period for data (e.g., "7d", "30d", "thisMonth")

## Response Format

All APIs return JSON with this structure:

```json
{
  "success": boolean,
  "data": any,
  "source": "ga4" | "mock",
  "error": string (optional)
}
```

## More Information

For detailed documentation on specific APIs, see the individual documentation files in this directory.
