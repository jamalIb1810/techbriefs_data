"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface AnalyticsChartProps {
  timeRange: string
  onTimeRangeChange: (value: string) => void
}

function parseGA4Date(dateString: string): Date {
  // GA4 returns dates in format YYYYMMDD (e.g., "20240110")
  if (dateString && dateString.length === 8 && /^\d{8}$/.test(dateString)) {
    const year = Number.parseInt(dateString.substring(0, 4))
    const month = Number.parseInt(dateString.substring(4, 6)) - 1 // Month is 0-indexed
    const day = Number.parseInt(dateString.substring(6, 8))
    return new Date(year, month, day)
  }
  // Fallback to regular date parsing
  return new Date(dateString)
}

export function AnalyticsChart({ timeRange, onTimeRangeChange }: AnalyticsChartProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(`/api/analytics/overview?timeRange=${timeRange}`)
        const result = await response.json()

        if (result.success && result.data) {
          const formattedData = result.data.map((item: any) => ({
            ...item,
            date: parseGA4Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          }))
          setChartData(formattedData)
          console.log("[v0] Chart data updated:", formattedData.length, "data points")
        }
      } catch (error) {
        console.error("[v0] Error fetching chart data:", error)
      }
    }

    fetchChartData()
  }, [timeRange])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Views, clicks, and engagement over time</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={chartType} onValueChange={(value) => setChartType(value as "line" | "bar")}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="60d">Last 60 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last 12 months</SelectItem>
                <SelectItem value="thisMonth">This month</SelectItem>
                <SelectItem value="lastMonth">Last month</SelectItem>
                <SelectItem value="thisYear">Year to date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {chartType === "line" ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Views" />
              <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} name="Clicks" />
              <Line type="monotone" dataKey="engagement" stroke="#f59e0b" strokeWidth={2} name="Engagement" />
            </LineChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                }}
              />
              <Legend />
              <Bar dataKey="views" fill="#3b82f6" name="Views" />
              <Bar dataKey="clicks" fill="#10b981" name="Clicks" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
