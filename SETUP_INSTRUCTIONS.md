# Google Analytics 4 Setup Instructions

This admin analytics dashboard can connect to your Google Analytics 4 property to display real-time data from your TechBriefs.blog website.

## Prerequisites

1. A Google Analytics 4 (GA4) property set up for your website
2. A Google Cloud Project with Analytics API enabled
3. A Service Account with access to your GA4 property

## Setup Steps

### 1. Find Your GA4 Property ID

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Click on **Admin** (gear icon in bottom left)
4. Under **Property Settings**, you'll see your **Property ID** (format: 123456789)

### 2. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Analytics Data API**:
   - Go to **APIs & Services** > **Library**
   - Search for "Google Analytics Data API"
   - Click **Enable**

4. Create a Service Account:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **Service Account**
   - Give it a name (e.g., "TechBriefs Analytics")
   - Click **Create and Continue**
   - Skip the optional steps and click **Done**

5. Create a JSON Key:
   - Click on your newly created service account
   - Go to the **Keys** tab
   - Click **Add Key** > **Create New Key**
   - Select **JSON** format
   - Download the JSON file (keep it secure!)

### 3. Grant Access to GA4

1. Go back to [Google Analytics](https://analytics.google.com/)
2. Click **Admin** (gear icon)
3. Under **Property**, click **Property Access Management**
4. Click the **+** icon in top right
5. Add the service account email (found in the JSON file, looks like: `your-service-account@your-project.iam.gserviceaccount.com`)
6. Give it **Viewer** role
7. Click **Add**

### 4. Add Environment Variables

You need to add two environment variables to your project:

#### `GA4_PROPERTY_ID`
Your GA4 Property ID (just the numbers, e.g., `123456789`)

#### `GA4_SERVICE_ACCOUNT_JSON`
The entire contents of your service account JSON file as a single-line string.

To convert the JSON file to a single line:
```bash
cat path/to/service-account.json | jq -c
```

Or manually remove all line breaks and format it as:
```json
{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### 5. Deploy and Test

1. Add the environment variables to your hosting platform (Vercel, etc.)
2. Redeploy your application
3. Log in to the admin dashboard
4. The banner at the top should disappear if GA4 is properly configured
5. Data from your GA4 property will now be displayed!

## Troubleshooting

- **"Using Demo Data" banner still showing**: Check that both environment variables are set correctly
- **No data appearing**: Ensure your service account has been granted access to the GA4 property
- **API errors**: Verify the Analytics Data API is enabled in your Google Cloud Project
- **Authentication errors**: Check that the service account JSON is formatted correctly (single line, valid JSON)

## Data Collected

The dashboard fetches the following from GA4:
- **Page views** (screenPageViews metric)
- **Sessions** (used to estimate clicks)
- **User engagement duration** (converted to engagement score)
- **Page-level data** (top articles by views)
- **Social traffic sources** (Facebook, LinkedIn, Pinterest, X.com, Instagram)

## Privacy Note

All data is fetched server-side. Your service account credentials are never exposed to the client.
