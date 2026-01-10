"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, Download, Search } from "lucide-react"

interface TopArticlesTableProps {
  limit?: number
  timeRange?: string
}

export function TopArticlesTable({ limit, timeRange = "7d" }: TopArticlesTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"views" | "clicks" | "ctr">("views")
  const [articles, setArticles] = useState<any[]>([])

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch(`/api/analytics/pages?timeRange=${timeRange}`)
        const result = await response.json()

        if (result.success && result.data) {
          setArticles(result.data)
          console.log("[v0] Articles data updated:", result.data.length, "articles")
        }
      } catch (error) {
        console.error("[v0] Error fetching articles:", error)
      }
    }

    fetchArticles()
  }, [timeRange])

  // Get unique categories
  const categories = ["all", ...Array.from(new Set(articles.map((a) => a.category)))]

  // Filter and sort articles
  let filteredArticles = articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || article.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  filteredArticles = filteredArticles.map((article) => ({
    ...article,
    ctr: article.views > 0 ? ((article.clicks / article.views) * 100).toFixed(2) : "0.00",
  }))

  filteredArticles = filteredArticles.sort((a, b) => {
    if (sortBy === "ctr") {
      return Number.parseFloat(b.ctr) - Number.parseFloat(a.ctr)
    }
    return b[sortBy] - a[sortBy]
  })

  const displayedArticles = limit ? filteredArticles.slice(0, limit) : filteredArticles

  const handleExport = () => {
    const csvContent = [
      ["Rank", "Title", "Category", "Views", "Clicks", "CTR"],
      ...displayedArticles.map((article, index) => [
        index + 1,
        `"${article.title}"`,
        article.category,
        article.views,
        article.clicks,
        article.ctr,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `techbriefs-analytics-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {!limit && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as "views" | "clicks" | "ctr")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="views">Sort by Views</SelectItem>
              <SelectItem value="clicks">Sort by Clicks</SelectItem>
              <SelectItem value="ctr">Sort by CTR</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Article Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Views</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">CTR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No articles found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              displayedArticles.map((article, index) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-medium max-w-md">
                    <div className="flex items-center gap-2">
                      {index < 3 && limit && <TrendingUp className="h-4 w-4 text-amber-500" />}
                      {article.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{article.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{article.views.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono">{article.clicks.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600">{article.ctr}%</span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
