"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  MessageSquare,
  Heart,
  Bookmark,
  FileText,
  Mail,
  UserPlus,
  UserMinus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react"

interface EngagementData {
  source: "ga4" | "mock"
  error?: string
  allReturnedEvents?: string[]
  dateRange: { startDate: string; endDate: string }
  summary: {
    totalComments: number
    totalReactions: number
    totalSaves: number
    totalSummarized: number
    netSubscribers: number
    totalSubscribes: number
    totalUnsubscribes: number
  }
  events: Array<{ name: string; count: number; users: number }>
  dailyTrend: Array<{
    date: string
    comment_post: number
    article_reaction: number
    article_save: number
    newsletter_subscribe: number
  }>
}

const EVENT_LABELS: Record<string, { label: string; icon: typeof MessageSquare; color: string }> = {
  comment_post: { label: "Comments Posted", icon: MessageSquare, color: "#3b82f6" },
  comment_reply: { label: "Comment Replies", icon: MessageSquare, color: "#60a5fa" },
  article_reaction: { label: "Article Reactions", icon: Heart, color: "#ef4444" },
  article_save: { label: "Articles Saved", icon: Bookmark, color: "#f59e0b" },
  article_summarized: { label: "AI Summaries", icon: FileText, color: "#8b5cf6" },
  newsletter_subscribe: { label: "Newsletter Subscribes", icon: UserPlus, color: "#22c55e" },
  newsletter_unsubscribe: { label: "Newsletter Unsubscribes", icon: UserMinus, color: "#ef4444" },
}

function parseGA4Date(dateStr: string): Date {
  if (/^\d{8}$/.test(dateStr)) {
    const year = parseInt(dateStr.slice(0, 4))
    const month = parseInt(dateStr.slice(4, 6)) - 1
    const day = parseInt(dateStr.slice(6, 8))
    return new Date(year, month, day)
  }
  return new Date(dateStr)
}

export function EngagementAnalytics({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState<EngagementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [showDebug, setShowDebug] = useState(false)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/engagement?timeRange=${timeRange}`)
      const json = await res.json()
      setData(json)
      setLastFetchedAt(new Date().toLocaleTimeString())
    } catch (err) {
      console.error("[v0] Engagement analytics fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) return null

  const { summary, events, dailyTrend } = data
  const totalEvents = events.reduce((s, e) => s + e.count, 0)
  const isNoData = data.source === "mock" || totalEvents === 0

  const chartData = dailyTrend.map((item) => ({
    ...item,
    date: parseGA4Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }))

  return (
    <div className="space-y-6">
      {/* GA4 Connection Debug Panel */}
      <div className="rounded-lg border bg-card">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition-colors"
          onClick={() => setShowDebug((v) => !v)}
        >
          <div className="flex items-center gap-2">
            {data?.source === "ga4" && !data?.error ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span>
              GA4 Connection:{" "}
              <span className={data?.source === "ga4" && !data?.error ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {data?.source === "ga4" && !data?.error ? "Connected — pulling real data" : "Not connected — showing zeros"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs">Last fetched: {lastFetchedAt ?? "—"}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); fetchData() }}
              disabled={loading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {showDebug ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {showDebug && (
          <div className="border-t px-4 py-4 space-y-4 text-sm">
            {data?.error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs font-mono">
                <p className="font-semibold mb-1">GA4 Error:</p>
                <p>{data.error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Date Range Queried</p>
                <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {data?.dateRange.startDate} → {data?.dateRange.endDate}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Data Source</p>
                <p className={`font-mono text-xs px-2 py-1 rounded font-semibold ${data?.source === "ga4" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {data?.source === "ga4" ? "ga4 (real data)" : "mock (fallback — no GA4 data)"}
                </p>
              </div>
            </div>

            {data?.allReturnedEvents && data.allReturnedEvents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  All Events GA4 Returned ({data.allReturnedEvents.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.allReturnedEvents.map((name) => {
                    const isEngagement = Object.keys(EVENT_LABELS).includes(name)
                    return (
                      <span
                        key={name}
                        className={`font-mono text-xs px-2 py-0.5 rounded-full border ${
                          isEngagement
                            ? "bg-green-50 text-green-700 border-green-200 font-semibold"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {name}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Engagement Event Counts</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {data?.events.map((e) => (
                  <div key={e.name} className="rounded-md border bg-muted/30 px-3 py-2">
                    <p className="font-mono text-xs text-muted-foreground truncate">{e.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-semibold text-foreground">{e.count.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{e.users} users</span>
                    </div>
                    {e.count === 0 && (
                      <p className="text-xs text-amber-600 mt-1">No data yet</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No data banner */}
      {isNoData && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">No engagement events recorded yet</p>
            <p className="text-amber-700 mt-0.5">
              The GA4 events (<span className="font-mono text-xs">comment_post</span>, <span className="font-mono text-xs">article_reaction</span>, etc.) have been created but have not received any data yet. This tab will automatically populate once users start interacting with articles.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalComments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Posts + Replies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Article Reactions</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalReactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Likes & reactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Articles Saved</CardTitle>
            <Bookmark className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSaves.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Bookmarked by users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Summaries</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalSummarized.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Articles summarized</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Subscribers</CardTitle>
            <Mail className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netSubscribers >= 0 ? "text-green-600" : "text-red-600"}`}>
              {summary.netSubscribers >= 0 ? "+" : ""}{summary.netSubscribers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalSubscribes} new, {summary.totalUnsubscribes} lost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Engagement Activity Trend</CardTitle>
            <CardDescription>Daily engagement events over time</CardDescription>
          </div>
          <Select value={chartType} onValueChange={(v) => setChartType(v as "line" | "bar")}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="comment_post" name="Comments" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="article_reaction" name="Reactions" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="article_save" name="Saves" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="newsletter_subscribe" name="Subscribes" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="comment_post" name="Comments" fill="#3b82f6" />
                  <Bar dataKey="article_reaction" name="Reactions" fill="#ef4444" />
                  <Bar dataKey="article_save" name="Saves" fill="#f59e0b" />
                  <Bar dataKey="newsletter_subscribe" name="Subscribes" fill="#22c55e" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Event Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Event Breakdown</CardTitle>
          <CardDescription>Detailed metrics for each engagement event</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="w-[200px]">Share</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const meta = EVENT_LABELS[event.name]
                const Icon = meta?.icon || MessageSquare
                const share = totalEvents > 0 ? (event.count / totalEvents) * 100 : 0

                return (
                  <TableRow key={event.name}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: meta?.color || "#6b7280" }} />
                        <div>
                          <p className="font-medium">{meta?.label || event.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{event.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{event.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{event.users.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={share} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-12 text-right">{share.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={event.count > 0 ? "default" : "secondary"}>
                        {event.count > 0 ? "Active" : "No data"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
