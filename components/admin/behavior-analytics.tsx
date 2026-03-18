"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, FileText, LogOut, Clock, Users, TrendingUp, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface BehaviorData {
  source: "ga4" | "mock"
  error?: string
  dateRange: { startDate: string; endDate: string }
  summary?: {
    totalPageViews: number
    totalSessions: number
    avgBounceRate: string
    topLandingPage: string
    topExitPage: string
    peakHour: number
    peakDay: string
  }
  landingPages: Array<{
    page: string
    sessions: number
    users: number
    newUsers: number
    bounceRate: number
    avgSessionDuration: number
    engagementRate: number
  }>
  exitPages: Array<{
    page: string
    pageViews: number
    exits: number
    users: number
    exitRate: number
  }>
  pagePerformance: Array<{
    page: string
    title: string
    pageViews: number
    users: number
    avgTimeOnPage: number
    bounceRate: number
    engagementRate: number
    totalEngagementTime: number
  }>
  hourlyData: Array<{
    hour: number
    sessions: number
    pageViews: number
    users: number
  }>
  dayOfWeekData: Array<{
    dayIndex: number
    day: string
    sessions: number
    pageViews: number
    users: number
  }>
  userTypes: Array<{
    type: string
    sessions: number
    users: number
    pageViews: number
    avgSessionDuration: number
    bounceRate: number
  }>
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"]

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM"
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return "12 PM"
  return `${hour - 12} PM`
}

export function BehaviorAnalytics({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState<BehaviorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pages")

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/behavior?timeRange=${timeRange}`)
      if (!res.ok) throw new Error("Failed to fetch behavior data")
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error || "No data available"}</p>
          <Button onClick={fetchData} variant="outline" size="sm" className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <FileText className="h-4 w-4" />
              Page Views
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.totalPageViews.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Sessions
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.totalSessions.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <LogOut className="h-4 w-4" />
              Avg Bounce Rate
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.avgBounceRate || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              Peak Hour
            </div>
            <p className="text-2xl font-bold mt-1">{formatHour(data.summary?.peakHour || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              Peak Day
            </div>
            <p className="text-xl font-bold mt-1">{data.summary?.peakDay || "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              User Types
            </div>
            <p className="text-2xl font-bold mt-1">{data.userTypes?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Time-based Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sessions by Hour</CardTitle>
            <CardDescription>When users visit your site (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.hourlyData}>
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(h) => h % 6 === 0 ? formatHour(h) : ""} 
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    labelFormatter={(h) => formatHour(h as number)}
                    formatter={(value: number) => [value.toLocaleString(), "Sessions"]}
                  />
                  <Bar dataKey="sessions" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sessions by Day of Week</CardTitle>
            <CardDescription>Traffic patterns throughout the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dayOfWeekData}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), "Sessions"]} />
                  <Bar dataKey="sessions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New vs Returning Users */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New vs Returning Users</CardTitle>
            <CardDescription>User loyalty distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.userTypes}
                    dataKey="users"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.userTypes?.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Type Performance</CardTitle>
            <CardDescription>Comparing new vs returning user behavior</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Avg Duration</TableHead>
                  <TableHead className="text-right">Bounce Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.userTypes?.map((ut) => (
                  <TableRow key={ut.type}>
                    <TableCell className="font-medium capitalize">{ut.type}</TableCell>
                    <TableCell className="text-right">{ut.sessions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{ut.users.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatDuration(ut.avgSessionDuration)}</TableCell>
                    <TableCell className="text-right">{ut.bounceRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="pages">All Pages</TabsTrigger>
          <TabsTrigger value="landing">Landing Pages</TabsTrigger>
          <TabsTrigger value="exit">Exit Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Performance</CardTitle>
              <CardDescription>Detailed metrics for all pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Avg Time</TableHead>
                      <TableHead className="text-right">Bounce</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pagePerformance?.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="max-w-xs">
                          <div className="font-medium truncate">{p.title || p.page}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.page}</div>
                        </TableCell>
                        <TableCell className="text-right">{p.pageViews.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{p.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatDuration(p.avgTimeOnPage)}</TableCell>
                        <TableCell className="text-right">{p.bounceRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.engagementRate > 50 ? "default" : "secondary"}>
                            {p.engagementRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Landing Pages</CardTitle>
              <CardDescription>First pages users see when they arrive</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">New Users</TableHead>
                      <TableHead className="text-right">Bounce Rate</TableHead>
                      <TableHead className="text-right">Avg Duration</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.landingPages?.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="max-w-xs truncate font-medium">{p.page}</TableCell>
                        <TableCell className="text-right">{p.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{p.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{p.newUsers.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.bounceRate < 50 ? "default" : "destructive"}>
                            {p.bounceRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatDuration(p.avgSessionDuration)}</TableCell>
                        <TableCell className="text-right">{p.engagementRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Exit Pages</CardTitle>
              <CardDescription>Last pages users view before leaving</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Page Views</TableHead>
                      <TableHead className="text-right">Exits</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Exit Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.exitPages?.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="max-w-xs truncate font-medium">{p.page}</TableCell>
                        <TableCell className="text-right">{p.pageViews.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{p.exits.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{p.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={p.exitRate < 50 ? "secondary" : "destructive"}>
                            {p.exitRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
