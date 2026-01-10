"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface CategoryBreakdownProps {
  timeRange?: string
}

export function CategoryBreakdown({ timeRange = "7d" }: CategoryBreakdownProps) {
  const [categoryStats, setCategoryStats] = useState<any[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`/api/analytics/categories?timeRange=${timeRange}`)
        const result = await response.json()

        if (result.success && result.data) {
          setCategoryStats(result.data)
          console.log("[v0] Category stats updated:", result.data)
        }
      } catch (error) {
        console.error("[v0] Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [timeRange])

  const maxViews = categoryStats.length > 0 ? Math.max(...categoryStats.map((c) => c.views)) : 1

  if (categoryStats.length === 0) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Category Performance</CardTitle>
            <CardDescription>Views and engagement by content category</CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center text-muted-foreground">
            No category data available for this time range
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Views and engagement by content category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {categoryStats.map((category) => (
            <div key={category.name} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">{category.name}</div>
                <div className="text-muted-foreground">{category.views.toLocaleString()} views</div>
              </div>
              <Progress value={(category.views / maxViews) * 100} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{category.articles} articles</span>
                <span className="font-medium text-green-600">{category.avgCTR}% avg CTR</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Insights</CardTitle>
          <CardDescription>Key metrics and recommendations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryStats.slice(0, 4).map((category, index) => (
            <div key={category.name} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                {index + 1}
              </div>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{category.name}</p>
                <p className="text-sm text-muted-foreground">
                  {category.articles} articles with {category.avgCTR}% average click-through rate
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
