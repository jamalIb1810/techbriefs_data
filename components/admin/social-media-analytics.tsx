"use client"

import { useState, useEffect } from "react"
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
import { TrendingUp, Users, Activity } from "lucide-react"

interface SocialMediaAnalyticsProps {
  timeRange?: string
}

function parseGA4Date(dateStr: string): Date {
  // If it's in GA4 format (YYYYMMDD), parse it correctly
  if (dateStr && /^\d{8}$/.test(dateStr)) {
    const year = Number.parseInt(dateStr.substring(0, 4))
    const month = Number.parseInt(dateStr.substring(4, 6)) - 1 // Month is 0-indexed
    const day = Number.parseInt(dateStr.substring(6, 8))
    return new Date(year, month, day)
  }
  // Otherwise, try to parse as regular date
  return new Date(dateStr)
}

export function SocialMediaAnalytics({ timeRange = "7d" }: SocialMediaAnalyticsProps) {
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [socialData, setSocialData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [stats, setStats] = useState({
    totalVisits: 0,
    avgEngagement: 0,
    bestPerformer: { name: "Loading...", visits: 0 },
  })

  useEffect(() => {
    const fetchSocialData = async () => {
      setIsLoading(true)
      setMessage("")
      try {
        const response = await fetch(`/api/analytics/social?timeRange=${timeRange}`)
        const result = await response.json()

        console.log("[v0] Social media API response:", result)

        if (result.success && result.data && result.data.length > 0) {
          setSocialData(result.data)

          const platformTotals: { [key: string]: number } = {
            facebook: 0,
            linkedin: 0,
            pinterest: 0,
            "x.com": 0,
            instagram: 0,
          }

          result.data.forEach((day: any) => {
            platformTotals.facebook += Number(day.facebook) || 0
            platformTotals.linkedin += Number(day.linkedin) || 0
            platformTotals.pinterest += Number(day.pinterest) || 0
            platformTotals["x.com"] += Number(day["x.com"]) || 0
            platformTotals.instagram += Number(day.instagram) || 0
          })

          const totalVisits = Object.values(platformTotals).reduce((sum, val) => sum + val, 0)

          let bestPlatform = { name: "None", visits: 0 }
          for (const [platform, visits] of Object.entries(platformTotals)) {
            if (visits > bestPlatform.visits) {
              bestPlatform = {
                name: platform.charAt(0).toUpperCase() + platform.slice(1).replace("x.com", "X.com"),
                visits,
              }
            }
          }

          setStats({
            totalVisits,
            avgEngagement:
              totalVisits > 0 ? ((platformTotals.linkedin + platformTotals.facebook) / totalVisits) * 100 : 0,
            bestPerformer: bestPlatform,
          })
        } else {
          setSocialData([])
          setStats({
            totalVisits: 0,
            avgEngagement: 0,
            bestPerformer: { name: "None", visits: 0 },
          })
          setMessage(result.message || "No social media traffic detected in the selected time range")
        }
      } catch (error) {
        console.error("[v0] Error fetching social data:", error)
        setSocialData([])
        setMessage("Error loading social media data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSocialData()
  }, [timeRange])

  const chartData = socialData.map((item) => ({
    date: parseGA4Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    LinkedIn: item.linkedin || 0,
    "X.com": item["x.com"] || 0,
    Facebook: item.facebook || 0,
    Pinterest: item.pinterest || 0,
    Instagram: item.instagram || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Social Traffic</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : stats.totalVisits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Selected time range</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? "Loading..." : `${stats.avgEngagement.toFixed(1)}%`}</div>
            <p className="text-xs text-muted-foreground">Across all platforms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Best Performer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bestPerformer.name}</div>
            <p className="text-xs text-muted-foreground">{stats.bestPerformer.visits.toLocaleString()} visits</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Social Media Traffic by Source</CardTitle>
              <CardDescription>Daily visits from each social platform</CardDescription>
            </div>
            <Select value={chartType} onValueChange={(value: "line" | "bar") => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {message ? (
            <div className="flex h-[400px] items-center justify-center">
              <div className="text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">{message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Check your GA4 property for social media traffic sources
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {chartType === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="LinkedIn" stroke="rgb(10, 102, 194)" strokeWidth={2} />
                  <Line type="monotone" dataKey="X.com" stroke="rgb(0, 0, 0)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Facebook" stroke="rgb(24, 119, 242)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Pinterest" stroke="rgb(230, 0, 35)" strokeWidth={2} />
                  <Line type="monotone" dataKey="Instagram" stroke="rgb(193, 53, 132)" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Bar dataKey="LinkedIn" fill="rgb(10, 102, 194)" />
                  <Bar dataKey="X.com" fill="rgb(0, 0, 0)" />
                  <Bar dataKey="Facebook" fill="rgb(24, 119, 242)" />
                  <Bar dataKey="Pinterest" fill="rgb(230, 0, 35)" />
                  <Bar dataKey="Instagram" fill="rgb(193, 53, 132)" />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
