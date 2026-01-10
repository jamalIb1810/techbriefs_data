"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { OverviewMetrics } from "@/components/admin/overview-metrics"
import { AnalyticsChart } from "@/components/admin/analytics-chart"
import { TopArticlesTable } from "@/components/admin/top-articles-table"
import { CategoryBreakdown } from "@/components/admin/category-breakdown"
import { SocialMediaAnalytics } from "@/components/admin/social-media-analytics"
import { ConnectionStatus } from "@/components/admin/connection-status"

export default function AdminDashboard() {
  const router = useRouter()
  const [timeRange, setTimeRange] = useState("7d")
  const [isGA4Configured, setIsGA4Configured] = useState<boolean | null>(null)

  useEffect(() => {
    const checkGA4Config = async () => {
      try {
        const response = await fetch("/api/analytics/overview?timeRange=7d")
        const result = await response.json()
        setIsGA4Configured(result.source === "ga4")
        console.log("[v0] GA4 configuration status:", result.source)
      } catch (error) {
        console.error("[v0] Error checking GA4 config:", error)
        setIsGA4Configured(false)
      }
    }
    checkGA4Config()
  }, [])

  const handleLogout = () => {
    document.cookie = "auth-token=; path=/; max-age=0"
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">TechBriefs Analytics</h1>
            <p className="text-sm text-muted-foreground">Monitor your blog performance</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <ConnectionStatus />
        </div>

        {/* Overview Metrics */}
        <OverviewMetrics timeRange={timeRange} />

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Analytics Chart */}
            <AnalyticsChart timeRange={timeRange} onTimeRangeChange={setTimeRange} />

            {/* Top Articles Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Articles</CardTitle>
                <CardDescription>Your most viewed content this week</CardDescription>
              </CardHeader>
              <CardContent>
                <TopArticlesTable limit={5} timeRange={timeRange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="articles" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Articles Performance</CardTitle>
                <CardDescription>Detailed analytics for all published articles</CardDescription>
              </CardHeader>
              <CardContent>
                <TopArticlesTable timeRange={timeRange} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6 mt-6">
            <CategoryBreakdown timeRange={timeRange} />
          </TabsContent>

          <TabsContent value="social" className="space-y-6 mt-6">
            <SocialMediaAnalytics timeRange={timeRange} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
