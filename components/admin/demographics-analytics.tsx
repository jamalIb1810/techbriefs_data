"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, MapPin, Globe, Flag, Languages } from "lucide-react"
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

interface DemographicsData {
  source: "ga4" | "mock"
  error?: string
  dateRange: { startDate: string; endDate: string }
  summary?: {
    totalSessions: number
    totalUsers: number
    uniqueCountries: number
    uniqueCities: number
    topCountry: string
    topCity: string
  }
  countries: Array<{
    country: string
    sessions: number
    users: number
    pageViews: number
    avgSessionDuration: number
    engagementRate: number
    bounceRate: number
  }>
  cities: Array<{
    city: string
    country: string
    sessions: number
    users: number
    pageViews: number
  }>
  regions: Array<{
    region: string
    country: string
    sessions: number
    users: number
  }>
  languages: Array<{
    language: string
    sessions: number
    users: number
    pageViews: number
  }>
  continents: Array<{
    continent: string
    sessions: number
    users: number
  }>
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}

export function DemographicsAnalytics({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState<DemographicsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("countries")

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/demographics?timeRange=${timeRange}`)
      if (!res.ok) throw new Error("Failed to fetch demographics data")
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
              <Globe className="h-4 w-4" />
              Total Sessions
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.totalSessions.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Flag className="h-4 w-4" />
              Countries
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.uniqueCountries || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              Cities
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.uniqueCities || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Top Country</div>
            <p className="text-xl font-bold mt-1 truncate">{data.summary?.topCountry || "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Top City</div>
            <p className="text-xl font-bold mt-1 truncate">{data.summary?.topCity || "N/A"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Languages className="h-4 w-4" />
              Languages
            </div>
            <p className="text-2xl font-bold mt-1">{data.languages?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Continent Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic by Continent</CardTitle>
            <CardDescription>Geographic distribution of your audience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.continents}
                    dataKey="sessions"
                    nameKey="continent"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ continent, percent }) => `${continent} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.continents.map((_, index) => (
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
            <CardTitle>Top Countries</CardTitle>
            <CardDescription>Countries with most traffic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.countries.slice(0, 8)} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="country" width={100} tick={{ fontSize: 12 }} />
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
        <TabsList className="grid w-full max-w-xl grid-cols-4">
          <TabsTrigger value="countries">Countries</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="regions">Regions</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
        </TabsList>

        <TabsContent value="countries" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Country Details</CardTitle>
              <CardDescription>Detailed metrics by country</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Page Views</TableHead>
                      <TableHead className="text-right">Avg Duration</TableHead>
                      <TableHead className="text-right">Engagement</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.countries.map((c) => (
                      <TableRow key={c.country}>
                        <TableCell className="font-medium">{c.country}</TableCell>
                        <TableCell className="text-right">{c.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.pageViews.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{formatDuration(c.avgSessionDuration)}</TableCell>
                        <TableCell className="text-right">{c.engagementRate.toFixed(1)}%</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">
                            {totalSessions > 0 ? ((c.sessions / totalSessions) * 100).toFixed(1) : 0}%
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

        <TabsContent value="cities" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>City Details</CardTitle>
              <CardDescription>Top cities by traffic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Page Views</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.cities.map((c, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{c.city}</TableCell>
                        <TableCell className="text-muted-foreground">{c.country}</TableCell>
                        <TableCell className="text-right">{c.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{c.pageViews.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {totalSessions > 0 ? ((c.sessions / totalSessions) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Region/State Details</CardTitle>
              <CardDescription>Traffic by region or state</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.regions?.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{r.region}</TableCell>
                        <TableCell className="text-muted-foreground">{r.country}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Language Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.languages.slice(0, 8)}
                        dataKey="sessions"
                        nameKey="language"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ language, percent }) => `${language.split("-")[0]} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.languages.slice(0, 8).map((_, index) => (
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
                <CardTitle>Language Details</CardTitle>
              </CardHeader>
              <CardContent className="max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Language</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.languages.map((l) => (
                      <TableRow key={l.language}>
                        <TableCell className="font-medium">{l.language}</TableCell>
                        <TableCell className="text-right">{l.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{l.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {totalSessions > 0 ? ((l.sessions / totalSessions) * 100).toFixed(1) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
