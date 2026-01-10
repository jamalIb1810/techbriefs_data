"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, MousePointerClick, Eye, BarChart3 } from "lucide-react"

interface OverviewMetricsProps {
  timeRange: string
}

export function OverviewMetrics({ timeRange }: OverviewMetricsProps) {
  const [metricsData, setMetricsData] = useState({
    totalViews: 0,
    totalClicks: 0,
    avgEngagement: 0,
    ctr: 0,
    dateRange: { start: "", end: "" },
    lastUpdated: "",
  })

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/analytics/overview?timeRange=${timeRange}`)
        const result = await response.json()

        if (result.success && result.data) {
          const totalViews = result.data.reduce((sum: number, day: any) => sum + day.views, 0)
          const totalClicks = result.data.reduce((sum: number, day: any) => sum + day.clicks, 0)
          const avgEngagement =
            result.data.reduce((sum: number, day: any) => sum + day.engagement, 0) / result.data.length
          const ctr = ((totalClicks / totalViews) * 100).toFixed(2)

          const parseGA4Date = (dateStr: string): Date => {
            // Check if it's GA4 format (YYYYMMDD)
            if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
              const year = dateStr.substring(0, 4)
              const month = dateStr.substring(4, 6)
              const day = dateStr.substring(6, 8)
              return new Date(`${year}-${month}-${day}`)
            }
            // Otherwise treat as regular date string
            return new Date(dateStr)
          }

          const dates = result.data.map((d: any) => parseGA4Date(d.date))
          const startDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
          const endDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())))

          setMetricsData({
            totalViews,
            totalClicks,
            avgEngagement,
            ctr: Number.parseFloat(ctr),
            dateRange: {
              start: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
              end: endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            },
            lastUpdated: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          })

          console.log("[v0] Overview metrics updated:", { totalViews, totalClicks, startDate, endDate })
        }
      } catch (error) {
        console.error("[v0] Error fetching overview metrics:", error)
      }
    }

    fetchMetrics()
  }, [timeRange])

  const metrics = [
    {
      title: "Total Views",
      value: metricsData.totalViews.toLocaleString(),
      change: "+12.5%",
      icon: Eye,
      trend: "up" as const,
    },
    {
      title: "Total Clicks",
      value: metricsData.totalClicks.toLocaleString(),
      change: "+8.2%",
      icon: MousePointerClick,
      trend: "up" as const,
    },
    {
      title: "Click Rate",
      value: `${metricsData.ctr}%`,
      change: "+0.4%",
      icon: TrendingUp,
      trend: "up" as const,
    },
    {
      title: "Avg Engagement",
      value: metricsData.avgEngagement.toFixed(1),
      change: "+1.2",
      icon: BarChart3,
      trend: "up" as const,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          <span className="font-medium">Data Range: </span>
          <span>
            {metricsData.dateRange.start} - {metricsData.dateRange.end}
          </span>
        </div>
        <div>
          <span className="font-medium">Last Updated: </span>
          <span>{metricsData.lastUpdated}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                  <p className="text-xs text-green-600 font-medium">{metric.change} from last period</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <metric.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
