"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react"

interface ConnectionTestResult {
  success: boolean
  message: string
  details: any
}

export function ConnectionStatus() {
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)
  const [testing, setTesting] = useState(false)

  const testConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/analytics/test-connection")
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test connection",
        details: null,
      })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  if (!testResult) {
    return (
      <Alert>
        <RefreshCw className="h-4 w-4 animate-spin" />
        <AlertDescription>Testing GA4 connection...</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {testResult.success ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Google Analytics Connected
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-600" />
              Connection Issue
            </>
          )}
        </CardTitle>
        <CardDescription>{testResult.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {testResult.success ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Property ID: {testResult.details?.propertyId}</span>
            </div>
            {testResult.details?.connectionTest?.sampleData && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>
                  Sample data retrieved: {testResult.details.connectionTest.sampleData.totalViews.toLocaleString()}{" "}
                  views
                </span>
              </div>
            )}
            <div className="rounded-md bg-green-50 p-3 mt-4">
              <p className="text-green-800 font-medium">✓ You are viewing REAL data from Google Analytics 4</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              {testResult.details?.envVarsPresent?.GA4_PROPERTY_ID ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>GA4_PROPERTY_ID environment variable</span>
            </div>
            <div className="flex items-center gap-2">
              {testResult.details?.envVarsPresent?.GA4_SERVICE_ACCOUNT_JSON ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span>GA4_SERVICE_ACCOUNT_JSON environment variable</span>
            </div>
            {testResult.details?.connectionTest?.error && (
              <div className="rounded-md bg-red-50 p-3 mt-4">
                <p className="text-red-800 font-medium">Error: {testResult.details.connectionTest.error}</p>
                <p className="text-red-700 text-xs mt-1">
                  Make sure your service account has been granted access to the GA4 property.
                </p>
              </div>
            )}
            <div className="rounded-md bg-yellow-50 p-3 mt-4">
              <p className="text-yellow-800 font-medium">⚠ Currently viewing MOCK data</p>
            </div>
          </div>
        )}
        <Button
          onClick={testConnection}
          disabled={testing}
          variant="outline"
          size="sm"
          className="w-full bg-transparent"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${testing ? "animate-spin" : ""}`} />
          Test Connection Again
        </Button>
      </CardContent>
    </Card>
  )
}
