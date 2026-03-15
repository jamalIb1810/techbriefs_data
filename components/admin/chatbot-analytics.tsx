"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  MessageSquare,
  MousePointerClick,
  AlertTriangle,
  TrendingUp,
  Users,
  BookOpen,
  Zap,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventStat {
  name: string
  count: number
  users: number
}

interface DailyTrendPoint {
  date: string
  chat_opened: number
  chat_message_sent: number
  chat_error: number
}

interface ChatbotData {
  source: "ga4" | "mock"
  error?: string
  allReturnedEvents?: string[]
  dateRange: { startDate: string; endDate: string }
  summary: {
    totalSessions: number
    totalMessages: number
    avgMessagesPerSession: number
    errorRate: number
    ctaClickRate: number
    articleClickRate: number
  }
  events: EventStat[]
  dailyTrend: DailyTrendPoint[]
  modeBreakdown: Record<string, number>
}

function parseGA4Date(raw: string): string {
  if (/^\d{8}$/.test(raw)) {
    const year = raw.slice(0, 4)
    const month = parseInt(raw.slice(4, 6)) - 1
    const day = parseInt(raw.slice(6, 8))
    return new Date(parseInt(year), month, day).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }
  const d = new Date(raw)
  return isNaN(d.getTime())
    ? raw
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const EVENT_META: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  chat_opened: {
    label: "Chat Opened",
    color: "#3b82f6",
    icon: <MessageSquare className="h-4 w-4" />,
    description: "User opened the chatbot widget",
  },
  chat_closed: {
    label: "Chat Closed",
    color: "#64748b",
    icon: <ChevronRight className="h-4 w-4" />,
    description: "User closed the chatbot widget",
  },
  chat_mode_selected: {
    label: "Mode Selected",
    color: "#8b5cf6",
    icon: <Zap className="h-4 w-4" />,
    description: "User selected a chat mode",
  },
  chat_message_sent: {
    label: "Message Sent",
    color: "#10b981",
    icon: <TrendingUp className="h-4 w-4" />,
    description: "User sent a message to the chatbot",
  },
  chat_article_clicked: {
    label: "Article Clicked",
    color: "#f59e0b",
    icon: <BookOpen className="h-4 w-4" />,
    description: "User clicked an article from chat results",
  },
  chat_cta_clicked: {
    label: "CTA Clicked",
    color: "#ef4444",
    icon: <MousePointerClick className="h-4 w-4" />,
    description: "User clicked a call-to-action in chat",
  },
  chat_error: {
    label: "Error",
    color: "#dc2626",
    icon: <AlertTriangle className="h-4 w-4" />,
    description: "An error occurred during the chat session",
  },
}

const MODE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]

export function ChatbotAnalytics({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState<ChatbotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartType, setChartType] = useState<"line" | "bar">("line")
  const [showDebug, setShowDebug] = useState(false)
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics/chatbot?timeRange=${timeRange}`)
      const json = await res.json()
      setData(json)
      setLastFetchedAt(new Date().toLocaleTimeString())
    } catch (err) {
      console.error("[v0] Chatbot analytics fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [timeRange])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const { summary, events, dailyTrend, modeBreakdown } = data

  const totalEvents = events.reduce((s, e) => s + e.count, 0)
  const isNoData = data.source === "mock" || totalEvents === 0

  const modeData = Object.entries(modeBreakdown).map(([name, value]) => ({
    name: name === "(not set)" ? "Unknown" : name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const trendChartData = dailyTrend.map((d) => ({
    ...d,
    date: parseGA4Date(d.date),
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
            {/* Error message if any */}
            {data?.error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs font-mono">
                <p className="font-semibold mb-1">GA4 Error:</p>
                <p>{data.error}</p>
              </div>
            )}

            {/* Date range */}
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

            {/* All events GA4 actually returned */}
            {data?.allReturnedEvents && data.allReturnedEvents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  All Events GA4 Returned ({data.allReturnedEvents.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.allReturnedEvents.map((name) => {
                    const isChatbot = name.startsWith("chat_")
                    return (
                      <span
                        key={name}
                        className={`font-mono text-xs px-2 py-0.5 rounded-full border ${
                          isChatbot
                            ? "bg-green-50 text-green-700 border-green-200 font-semibold"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {name}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Green = chatbot events matched. If your event names are missing here, they may not be firing yet or may have different names in GA4.
                </p>
              </div>
            )}

            {/* Raw event counts */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Chatbot Event Counts</p>
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

            {/* What to check */}
            {(data?.source === "mock" || data?.error) && (
              <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-blue-800 text-xs space-y-1">
                <p className="font-semibold">What to check:</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                  <li>Confirm <span className="font-mono">GA4_PROPERTY_ID</span> is set in your environment variables</li>
                  <li>Confirm <span className="font-mono">GA4_SERVICE_ACCOUNT_KEY</span> is valid JSON</li>
                  <li>Ensure the Service Account has <strong>Viewer</strong> access to your GA4 property</li>
                  <li>Check that the chatbot is firing these exact event names in GA4: <span className="font-mono">chat_opened</span>, <span className="font-mono">chat_message_sent</span>, etc.</li>
                  <li>In GA4 &rarr; Events, confirm these custom events appear in the event list</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* No data banner */}
      {isNoData && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">No chatbot events recorded yet</p>
            <p className="text-amber-700 mt-0.5">
              The GA4 events (<span className="font-mono text-xs">chat_opened</span>, <span className="font-mono text-xs">chat_message_sent</span>, etc.) have been created but have not received any data yet. This tab will automatically populate once users start interacting with the Ask TechBriefs chatbot.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Sessions</p>
            <p className="text-2xl font-bold text-foreground">{summary.totalSessions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">chat_opened</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Messages</p>
            <p className="text-2xl font-bold text-foreground">{summary.totalMessages.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">chat_message_sent</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Msg / Session</p>
            <p className="text-2xl font-bold text-foreground">{summary.avgMessagesPerSession}</p>
            <p className="text-xs text-muted-foreground mt-1">avg depth</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Error Rate</p>
            <p className={`text-2xl font-bold ${summary.errorRate > 5 ? "text-red-600" : "text-foreground"}`}>
              {summary.errorRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">chat_error</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">CTA Click Rate</p>
            <p className="text-2xl font-bold text-foreground">{summary.ctaClickRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">chat_cta_clicked</p>
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Article Click Rate</p>
            <p className="text-2xl font-bold text-foreground">{summary.articleClickRate}%</p>
            <p className="text-xs text-muted-foreground mt-1">chat_article_clicked</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Daily Activity Trend</CardTitle>
            <CardDescription>Sessions, messages sent, and errors over time</CardDescription>
          </div>
          <Select value={chartType} onValueChange={(v) => setChartType(v as "line" | "bar")}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {trendChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No chatbot activity in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              {chartType === "line" ? (
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="chat_opened" name="Opened" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="chat_message_sent" name="Messages Sent" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="chat_error" name="Errors" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              ) : (
                <BarChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="chat_opened" name="Opened" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="chat_message_sent" name="Messages Sent" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="chat_error" name="Errors" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Event Breakdown Table + Mode Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Per-Event Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Event Breakdown</CardTitle>
            <CardDescription>All tracked chatbot events for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Header row */}
              <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 py-2">
                <span className="col-span-5">Event</span>
                <span className="col-span-2 text-right">Count</span>
                <span className="col-span-2 text-right">Users</span>
                <span className="col-span-3 text-right">Share</span>
              </div>

              {events
                .slice()
                .sort((a, b) => b.count - a.count)
                .map((event) => {
                  const meta = EVENT_META[event.name]
                  const share = totalEvents > 0 ? ((event.count / totalEvents) * 100).toFixed(1) : "0.0"
                  return (
                    <div
                      key={event.name}
                      className="grid grid-cols-12 items-center px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Event name + icon */}
                      <div className="col-span-5 flex items-center gap-2 min-w-0">
                        <span
                          className="flex-shrink-0 p-1.5 rounded-md"
                          style={{ backgroundColor: `${meta?.color}18`, color: meta?.color }}
                        >
                          {meta?.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{meta?.label ?? event.name}</p>
                          <p className="text-xs text-muted-foreground truncate font-mono">{event.name}</p>
                        </div>
                      </div>

                      {/* Count */}
                      <span className="col-span-2 text-right text-sm font-semibold tabular-nums">
                        {event.count.toLocaleString()}
                      </span>

                      {/* Users */}
                      <span className="col-span-2 text-right text-sm text-muted-foreground tabular-nums">
                        {event.users.toLocaleString()}
                      </span>

                      {/* Share bar + % */}
                      <div className="col-span-3 flex items-center gap-2 justify-end">
                        <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${share}%`,
                              backgroundColor: meta?.color,
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{share}%</span>
                      </div>
                    </div>
                  )
                })}

              {events.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No chatbot events found in this period
                </div>
              )}
            </div>

            {/* Total row */}
            {events.length > 0 && (
              <div className="grid grid-cols-12 items-center px-3 py-3 border-t mt-2">
                <span className="col-span-5 text-sm font-semibold">Total</span>
                <span className="col-span-2 text-right text-sm font-semibold tabular-nums">
                  {totalEvents.toLocaleString()}
                </span>
                <span className="col-span-2 text-right text-sm text-muted-foreground tabular-nums">
                  {events.reduce((s, e) => s + e.users, 0).toLocaleString()}
                </span>
                <span className="col-span-3 text-right text-xs text-muted-foreground">100%</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mode Breakdown Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Mode Breakdown</CardTitle>
            <CardDescription>Distribution of chat modes selected</CardDescription>
          </CardHeader>
          <CardContent>
            {modeData.length === 0 || modeData.every((m) => m.value === 0) ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No mode data available
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={modeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {modeData.map((_, i) => (
                        <Cell key={i} fill={MODE_COLORS[i % MODE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v.toLocaleString(), "Events"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {modeData.map((item, i) => {
                    const total = modeData.reduce((s, m) => s + m.value, 0)
                    const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0"
                    return (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: MODE_COLORS[i % MODE_COLORS.length] }}
                          />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium tabular-nums">{item.value.toLocaleString()}</span>
                          <Badge variant="secondary" className="text-xs">{pct}%</Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Description Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Event Reference</CardTitle>
          <CardDescription>What each tracked GA4 event represents in the chatbot lifecycle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Object.entries(EVENT_META).map(([key, meta]) => (
              <div key={key} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                <span
                  className="p-1.5 rounded-md flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
                >
                  {meta.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{meta.label}</p>
                  <p className="text-xs font-mono text-muted-foreground">{key}</p>
                  <p className="text-xs text-muted-foreground mt-1">{meta.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
