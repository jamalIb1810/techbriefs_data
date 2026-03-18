"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, TrendingUp, Users, UserPlus, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"

interface TrafficData {
  source: "ga4" | "mock"
  error?: string
  dateRange: { startDate: string; endDate: string }
  summary?: {
    totalSessions: number
    totalUsers: number
    totalNewUsers: number
    newUserRate: string | number
    topChannel: string
    topSource: string
  }
  sourceMedium: Array<{
    source: string
    medium: string
    sessions: number
    users: number
    newUsers: number
    pageViews: number
    avgSessionDuration: number
    bounceRate: number
    engagementRate: number
  }>
  channels: Array<{
    channel: string
    sessions: number
    users: number
    newUsers: number
    pageViews: number
    avgSessionDuration: number
    bounceRate: number
    engagementRate: number
  }>
  campaigns: Array<{
    campaign: string
    sessions: number
    users: number
    pageViews: number
    bounceRate: number
  }>
  referrers: Array<{
    referrer: string
    domain: string
    sessions: number
    users: number
  }>
  acquisition: Array<{
    source: string
    medium: string
    newUsers: number
    totalUsers: number
  }>
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}

export function TrafficAnalytics({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState<TrafficData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("channels")

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/traffic?timeRange=${timeRange}`)
      if (!res.ok) throw new Error("Failed to fetch traffic data")
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

  const totalSessions = data.summary?.totalSessions || 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Total Sessions
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.totalSessions.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              Total Users
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.totalUsers.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <UserPlus className="h-4 w-4" />
              New Users
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.totalNewUsers.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">New User Rate</div>
            <p className="text-2xl font-bold mt-1">{data.summary?.newUserRate || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Top Channel</div>
            <p className="text-xl font-bold mt-1 truncate">{data.summary?.topChannel || "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Top Source</div>
            <p className="text-xl font-bold mt-1 truncate">{data.summary?.topSource || "N/A"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic Channels</CardTitle>
            <CardDescription>How users find your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.channels}
                    dataKey="sessions"
                    nameKey="channel"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ channel, percent }) => `${channel} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.channels.map((_, index) => (
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
            <CardTitle>Top Sources</CardTitle>
            <CardDescription>Traffic sources by sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sourceMedium.slice(0, 8)} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="source" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="sessions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="sources">Source/Medium</TabsTrigger>
          <TabsTrigger value="referrers">Referrers</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Channel Performance</CardTitle>
              <CardDescription>Detailed metrics by traffic channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">New Users</TableHead>
                      <TableHead className="text-right">Page Views</TableHead>
                      <TableHead className="text-right">Avg Duration</TableHead>
                      <TableHead className="text-right">Bounce Rate</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.channels.map((c) => (
                      <TableRow key={c.channel}>
                        <TableCell className="font-medium">{c.channel}</TableCell>
                        <TableCell className="text-right">{c.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.newUsers.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.pageViews.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatDuration(c.avgSessionDuration)}</TableCell>
                        <TableCell className="text-right">{c.bounceRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={c.engagementRate > 50 ? "default" : "secondary"}>
                            {c.engagementRate.toFixed(1)}%
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

        <TabsContent value="sources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Source / Medium Breakdown</CardTitle>
              <CardDescription>Traffic sources with their mediums</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Medium</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">New Users</TableHead>
                      <TableHead className="text-right">Bounce Rate</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.sourceMedium.map((sm, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{sm.source}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{sm.medium}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{sm.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{sm.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{sm.newUsers.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{sm.bounceRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{sm.engagementRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Referrer URLs</CardTitle>
              <CardDescription>External sites sending traffic to you</CardDescription>
            </CardHeader>
            <CardContent>
              {data.referrers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No referrer data available</p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Domain</TableHead>
                        <TableHead>Full URL</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.referrers.map((r, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{r.domain}</TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                            <a
                              href={r.referrer}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              {r.referrer.slice(0, 50)}...
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </TableCell>
                          <TableCell className="text-right">{r.sessions.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{r.users.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {totalSessions > 0 ? ((r.sessions / totalSessions) * 100).toFixed(1) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Campaigns</CardTitle>
              <CardDescription>Performance of tagged campaigns (UTM parameters)</CardDescription>
            </CardHeader>
            <CardContent>
              {data.campaigns.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No campaign data available. Use UTM parameters to track campaigns.
                </p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Campaign</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Page Views</TableHead>
                        <TableHead className="text-right">Bounce Rate</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.campaigns.map((c, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{c.campaign}</TableCell>
                          <TableCell className="text-right">{c.sessions.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{c.users.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{c.pageViews.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{c.bounceRate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            {totalSessions > 0 ? ((c.sessions / totalSessions) * 100).toFixed(1) : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="acquisition" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Acquisition</CardTitle>
              <CardDescription>How you acquire new users (first touch attribution)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Source</TableHead>
                      <TableHead>First Medium</TableHead>
                      <TableHead className="text-right">New Users</TableHead>
                      <TableHead className="text-right">Total Users</TableHead>
                      <TableHead className="text-right">New User %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.acquisition?.map((a, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{a.source}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{a.medium}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{a.newUsers.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{a.totalUsers.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {a.totalUsers > 0 ? ((a.newUsers / a.totalUsers) * 100).toFixed(1) : 0}%
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
