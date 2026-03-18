"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Monitor, Smartphone, Tablet, Globe, Laptop } from "lucide-react"
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
  Legend,
} from "recharts"

interface DevicesData {
  source: "ga4" | "mock"
  error?: string
  dateRange: { startDate: string; endDate: string }
  summary?: {
    totalSessions: number
    totalUsers: number
    mobileShare: string | number
    desktopShare: string | number
    tabletShare: string | number
  }
  deviceCategories: Array<{
    category: string
    sessions: number
    users: number
    pageViews: number
    avgSessionDuration: number
    bounceRate: number
    engagementRate: number
  }>
  browsers: Array<{
    browser: string
    sessions: number
    users: number
    pageViews: number
    avgSessionDuration: number
    bounceRate: number
  }>
  operatingSystems: Array<{
    os: string
    sessions: number
    users: number
    pageViews: number
    avgSessionDuration: number
    bounceRate: number
  }>
  screenResolutions: Array<{
    resolution: string
    sessions: number
    users: number
  }>
  deviceBrands: Array<{
    brand: string
    sessions: number
    users: number
  }>
  deviceModels: Array<{
    model: string
    sessions: number
    users: number
  }>
  osVersions: Array<{
    os: string
    version: string
    sessions: number
    users: number
  }>
  browserVersions: Array<{
    browser: string
    version: string
    sessions: number
    users: number
  }>
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor className="h-5 w-5" />,
  mobile: <Smartphone className="h-5 w-5" />,
  tablet: <Tablet className="h-5 w-5" />,
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  return `${mins}m ${secs}s`
}

export function DevicesAnalytics({ timeRange }: { timeRange: string }) {
  const [data, setData] = useState<DevicesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/devices?timeRange=${timeRange}`)
      if (!res.ok) throw new Error("Failed to fetch devices data")
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

  const totalSessions = data.deviceCategories.reduce((sum, d) => sum + d.sessions, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <Monitor className="h-4 w-4" />
              Desktop
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.desktopShare || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Smartphone className="h-4 w-4" />
              Mobile
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.mobileShare || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Tablet className="h-4 w-4" />
              Tablet
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.tabletShare || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Laptop className="h-4 w-4" />
              Total Users
            </div>
            <p className="text-2xl font-bold mt-1">{data.summary?.totalUsers.toLocaleString() || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Device Category Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Categories</CardTitle>
            <CardDescription>Sessions by device type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.deviceCategories}
                    dataKey="sessions"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.deviceCategories.map((_, index) => (
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
            <CardTitle>Device Performance</CardTitle>
            <CardDescription>Engagement metrics by device</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Bounce Rate</TableHead>
                  <TableHead className="text-right">Avg Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.deviceCategories.map((device) => (
                  <TableRow key={device.category}>
                    <TableCell className="flex items-center gap-2 capitalize">
                      {DEVICE_ICONS[device.category] || <Globe className="h-4 w-4" />}
                      {device.category}
                    </TableCell>
                    <TableCell className="text-right">{device.sessions.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{device.bounceRate.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{formatDuration(device.avgSessionDuration)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="overview">Browsers</TabsTrigger>
          <TabsTrigger value="os">Operating Systems</TabsTrigger>
          <TabsTrigger value="brands">Brands</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="screens">Screens</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Browser Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.browsers.slice(0, 8)} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="browser" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="sessions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Browser Details</CardTitle>
              </CardHeader>
              <CardContent className="max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Browser</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Bounce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.browsers.map((b) => (
                      <TableRow key={b.browser}>
                        <TableCell className="font-medium">{b.browser}</TableCell>
                        <TableCell className="text-right">{b.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{b.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{b.bounceRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Browser Versions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Browser Versions</CardTitle>
              <CardDescription>Top browser version combinations</CardDescription>
            </CardHeader>
            <CardContent className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Browser</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.browserVersions?.slice(0, 15).map((bv, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{bv.browser}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{bv.version}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{bv.sessions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{bv.users.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="os" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>OS Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.operatingSystems.slice(0, 6)}
                        dataKey="sessions"
                        nameKey="os"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ os, percent }) => `${os} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.operatingSystems.slice(0, 6).map((_, index) => (
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
                <CardTitle>OS Details</CardTitle>
              </CardHeader>
              <CardContent className="max-h-80 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operating System</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Bounce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.operatingSystems.map((os) => (
                      <TableRow key={os.os}>
                        <TableCell className="font-medium">{os.os}</TableCell>
                        <TableCell className="text-right">{os.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{os.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{os.bounceRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* OS Versions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>OS Versions</CardTitle>
              <CardDescription>Detailed operating system versions</CardDescription>
            </CardHeader>
            <CardContent className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OS</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.osVersions?.slice(0, 15).map((ov, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{ov.os}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ov.version}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{ov.sessions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{ov.users.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brands" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Mobile Device Brands</CardTitle>
              <CardDescription>Top device manufacturers for mobile/tablet traffic</CardDescription>
            </CardHeader>
            <CardContent>
              {data.deviceBrands.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No mobile brand data available</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.deviceBrands.slice(0, 10)} layout="vertical">
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="brand" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="sessions" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.deviceBrands.slice(0, 10).map((b) => (
                        <TableRow key={b.brand}>
                          <TableCell className="font-medium">{b.brand}</TableCell>
                          <TableCell className="text-right">{b.sessions.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{b.users.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {totalSessions > 0 ? ((b.sessions / totalSessions) * 100).toFixed(1) : 0}%
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

        <TabsContent value="models" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Device Models</CardTitle>
              <CardDescription>Specific device models used to access your site</CardDescription>
            </CardHeader>
            <CardContent>
              {data.deviceModels.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No device model data available</p>
              ) : (
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead className="text-right">Sessions</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.deviceModels.map((m, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{m.model}</TableCell>
                          <TableCell className="text-right">{m.sessions.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{m.users.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            {totalSessions > 0 ? ((m.sessions / totalSessions) * 100).toFixed(1) : 0}%
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

        <TabsContent value="screens" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Screen Resolutions</CardTitle>
              <CardDescription>Display resolutions of your visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.screenResolutions.slice(0, 10)} layout="vertical">
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="resolution" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="sessions" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resolution</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.screenResolutions.slice(0, 15).map((s) => (
                      <TableRow key={s.resolution}>
                        <TableCell className="font-mono text-sm">{s.resolution}</TableCell>
                        <TableCell className="text-right">{s.sessions.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{s.users.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          {totalSessions > 0 ? ((s.sessions / totalSessions) * 100).toFixed(1) : 0}%
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
