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
  BookmarkMinus,
  FileText,
  Mail,
  UserPlus,
  UserMinus,
  Star,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react"

interface EngagementSummary {
  totalComments: number
  commentPosts: number
  commentReplies: number
  replyRatio: number
  totalReactions: number
  totalSaves: number
  totalUnsaves: number
  netSaves: number
  saveRetention: number
  totalSummarized: number
  netSubscribers: number
  totalSubscribes: number
  totalUnsubscribes: number
  totalReviews: number
  totalReviewSubmits: number
  totalReviewEdits: number
  totalReviewDeletes: number
  reviewEditRate: number
  reviewRetention: number
}

interface EngagementData {
  source: "ga4" | "mock"
  error?: string
  allReturnedEvents?: string[]
  dateRange: { startDate: string; endDate: string }
  summary: EngagementSummary
  events: Array<{ name: string; count: number; users: number }>
  dailyTrend: Array<Record<string, number | string>>
}

const EVENT_LABELS: Record<string, { label: string; icon: typeof MessageSquare; color: string; category: string }> = {
  comment_post: { label: "Comments Posted", icon: MessageSquare, color: "#3b82f6", category: "Comments" },
  comment_reply: { label: "Comment Replies", icon: MessageSquare, color: "#60a5fa", category: "Comments" },
  article_reaction: { label: "Article Reactions", icon: Heart, color: "#ef4444", category: "Articles" },
  article_save: { label: "Articles Saved", icon: Bookmark, color: "#f59e0b", category: "Articles" },
  article_unsave: { label: "Articles Unsaved", icon: BookmarkMinus, color: "#d97706", category: "Articles" },
  article_summarized: { label: "AI Summaries", icon: FileText, color: "#8b5cf6", category: "Articles" },
  newsletter_subscribe: { label: "Newsletter Subscribes", icon: UserPlus, color: "#22c55e", category: "Newsletter" },
  newsletter_unsubscribe: { label: "Newsletter Unsubscribes", icon: UserMinus, color: "#dc2626", category: "Newsletter" },
  review_submit: { label: "Reviews Submitted", icon: Star, color: "#eab308", category: "Reviews" },
  review_edit: { label: "Reviews Edited", icon: Pencil, color: "#a3a3a3", category: "Reviews" },
  review_delete: { label: "Reviews Deleted", icon: Trash2, color: "#ef4444", category: "Reviews" },
}

const CATEGORIES = ["Comments", "Articles", "Newsletter", "Reviews"] as const

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
  const [chartCategory, setChartCategory] = useState<string>("all")
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
      console.error("Engagement analytics fetch error:", err)
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!data) return null

  const { summary, events, dailyTrend } = data
  const totalEvents = events.reduce((s, e) => s + e.count, 0)
  const isNoData = data.source === "mock" || totalEvents === 0

  // Chart line definitions by category
  const chartLines: Record<string, Array<{ key: string; name: string; color: string }>> = {
    all: [
      { key: "comment_post", name: "Comments", color: "#3b82f6" },
      { key: "article_reaction", name: "Reactions", color: "#ef4444" },
      { key: "article_save", name: "Saves", color: "#f59e0b" },
      { key: "newsletter_subscribe", name: "Subscribes", color: "#22c55e" },
      { key: "review_submit", name: "Reviews", color: "#eab308" },
    ],
    comments: [
      { key: "comment_post", name: "Posts", color: "#3b82f6" },
      { key: "comment_reply", name: "Replies", color: "#60a5fa" },
    ],
    articles: [
      { key: "article_reaction", name: "Reactions", color: "#ef4444" },
      { key: "article_save", name: "Saves", color: "#f59e0b" },
      { key: "article_unsave", name: "Unsaves", color: "#d97706" },
      { key: "article_summarized", name: "AI Summaries", color: "#8b5cf6" },
    ],
    newsletter: [
      { key: "newsletter_subscribe", name: "Subscribes", color: "#22c55e" },
      { key: "newsletter_unsubscribe", name: "Unsubscribes", color: "#dc2626" },
    ],
    reviews: [
      { key: "review_submit", name: "Submitted", color: "#eab308" },
      { key: "review_edit", name: "Edited", color: "#a3a3a3" },
      { key: "review_delete", name: "Deleted", color: "#ef4444" },
    ],
  }

  const activeLines = chartLines[chartCategory] || chartLines.all

  const chartData = dailyTrend.map((item) => ({
    ...item,
    date: parseGA4Date(item.date as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }))

  // Group events by category for the table
  const eventsByCategory = CATEGORIES.map((cat) => ({
    category: cat,
    events: events.filter((e) => EVENT_LABELS[e.name]?.category === cat),
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
            {data.source === "ga4" && !data.error ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span>
              {"GA4 Connection: "}
              <span className={data.source === "ga4" && !data.error ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {data.source === "ga4" && !data.error ? "Connected — pulling real data" : "Not connected — showing zeros"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs">{"Last fetched: "}{lastFetchedAt ?? "—"}</span>
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
            {data.error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-red-800 text-xs font-mono">
                <p className="font-semibold mb-1">GA4 Error:</p>
                <p>{data.error}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Date Range Queried</p>
                <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {data.dateRange.startDate}{" → "}{data.dateRange.endDate}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Data Source</p>
                <p className={`font-mono text-xs px-2 py-1 rounded font-semibold ${data.source === "ga4" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {data.source === "ga4" ? "ga4 (real data)" : "mock (fallback)"}
                </p>
              </div>
            </div>
            {data.allReturnedEvents && data.allReturnedEvents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  {"All Events GA4 Returned ("}{data.allReturnedEvents.length}{")"}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.allReturnedEvents.map((name) => {
                    const isEngagement = name in EVENT_LABELS
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Raw Event Counts</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {events.map((e) => (
                  <div key={e.name} className="rounded-md border bg-muted/30 px-3 py-2">
                    <p className="font-mono text-xs text-muted-foreground truncate">{e.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-semibold text-foreground">{e.count.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{e.users} users</span>
                    </div>
                    {e.count === 0 && <p className="text-xs text-amber-600 mt-1">No data yet</p>}
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
              {"The GA4 events have been created but have not received any data yet. Events will populate once users start interacting with the site."}
            </p>
          </div>
        </div>
      )}

      {/* ── Comments Section ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <MessageSquare className="h-4 w-4" /> Comments
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalComments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.commentPosts} posts + {summary.commentReplies} replies
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reply Ratio</CardTitle>
              <ArrowRight className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.replyRatio}x</div>
              <p className="text-xs text-muted-foreground">Replies per original comment</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Commenters</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(events.find((e) => e.name === "comment_post")?.users || 0) +
                  (events.find((e) => e.name === "comment_reply")?.users || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Distinct users who commented</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Articles Section ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Heart className="h-4 w-4" /> Article Interactions
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reactions</CardTitle>
              <Heart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReactions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {events.find((e) => e.name === "article_reaction")?.users || 0} users reacted
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Saves</CardTitle>
              <Bookmark className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netSaves >= 0 ? "text-green-600" : "text-red-600"}`}>
                {summary.netSaves >= 0 ? "+" : ""}{summary.netSaves.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.totalSaves} saved, {summary.totalUnsaves} unsaved
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Save Retention</CardTitle>
              {summary.saveRetention >= 50 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.saveRetention}%</div>
              <p className="text-xs text-muted-foreground">Saves kept vs unsaved</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Summaries</CardTitle>
              <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalSummarized.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Articles summarized by AI</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Star className="h-4 w-4" /> Reviews
        </h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews Submitted</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReviewSubmits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">New reviews written</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews Edited</CardTitle>
              <Pencil className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReviewEdits.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.reviewEditRate}% edit rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews Deleted</CardTitle>
              <Trash2 className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReviewDeletes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.reviewRetention}% retention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activity</CardTitle>
              <Star className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalReviews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">All review actions combined</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Newsletter Section ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Mail className="h-4 w-4" /> Newsletter
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Subscribes</CardTitle>
              <UserPlus className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.totalSubscribes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {events.find((e) => e.name === "newsletter_subscribe")?.users || 0} unique users
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribes</CardTitle>
              <UserMinus className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.totalUnsubscribes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {summary.totalSubscribes > 0
                  ? `${((summary.totalUnsubscribes / summary.totalSubscribes) * 100).toFixed(1)}% churn rate`
                  : "No churn data"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Daily Activity Trend ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Engagement Activity Trend</CardTitle>
            <CardDescription>Daily engagement events over time</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={chartCategory} onValueChange={setChartCategory}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="comments">Comments</SelectItem>
                <SelectItem value="articles">Articles</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="reviews">Reviews</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(v) => setChartType(v as "line" | "bar")}>
              <SelectTrigger className="w-[120px]">
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
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "line" ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  {activeLines.map((l) => (
                    <Line key={l.key} type="monotone" dataKey={l.key} name={l.name} stroke={l.color} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  {activeLines.map((l) => (
                    <Bar key={l.key} dataKey={l.key} name={l.name} fill={l.color} />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Event Breakdown Table (Grouped by Category) ── */}
      <Card>
        <CardHeader>
          <CardTitle>Full Event Breakdown</CardTitle>
          <CardDescription>All 11 engagement events grouped by category with counts, users, and share</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Users</TableHead>
                <TableHead className="w-[180px]">Share</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventsByCategory.map((group) =>
                group.events.map((event) => {
                  const meta = EVENT_LABELS[event.name]
                  const Icon = meta?.icon || MessageSquare
                  const share = totalEvents > 0 ? (event.count / totalEvents) * 100 : 0

                  return (
                    <TableRow key={event.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 flex-shrink-0" style={{ color: meta?.color || "#6b7280" }} />
                          <div>
                            <p className="font-medium">{meta?.label || event.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">{event.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{group.category}</Badge>
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
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
