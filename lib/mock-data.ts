export interface AnalyticsData {
  date: string
  views: number
  clicks: number
  engagement: number
}

export interface TopArticle {
  id: string
  title: string
  views: number
  clicks: number
  ctr: number
  category: string
}

export const mockAnalyticsData: AnalyticsData[] = [
  { date: "2024-01-01", views: 12450, clicks: 890, engagement: 7.1 },
  { date: "2024-01-02", views: 13200, clicks: 950, engagement: 7.2 },
  { date: "2024-01-03", views: 11800, clicks: 820, engagement: 6.9 },
  { date: "2024-01-04", views: 14500, clicks: 1100, engagement: 7.6 },
  { date: "2024-01-05", views: 15200, clicks: 1200, engagement: 7.9 },
  { date: "2024-01-06", views: 13900, clicks: 980, engagement: 7.0 },
  { date: "2024-01-07", views: 16800, clicks: 1350, engagement: 8.0 },
  { date: "2024-01-08", views: 14200, clicks: 1050, engagement: 7.4 },
  { date: "2024-01-09", views: 15600, clicks: 1180, engagement: 7.6 },
  { date: "2024-01-10", views: 17200, clicks: 1420, engagement: 8.3 },
  { date: "2024-01-11", views: 16500, clicks: 1280, engagement: 7.8 },
  { date: "2024-01-12", views: 15100, clicks: 1150, engagement: 7.6 },
  { date: "2024-01-13", views: 14800, clicks: 1090, engagement: 7.4 },
  { date: "2024-01-14", views: 18200, clicks: 1520, engagement: 8.4 },
]

export const mockTopArticles: TopArticle[] = [
  {
    id: "1",
    title: "Understanding React Server Components in 2024",
    views: 45230,
    clicks: 3890,
    ctr: 8.6,
    category: "React",
  },
  {
    id: "2",
    title: "Next.js 15: Complete Guide to App Router",
    views: 38900,
    clicks: 3120,
    ctr: 8.0,
    category: "Next.js",
  },
  {
    id: "3",
    title: "TypeScript 5.3 New Features Explained",
    views: 32500,
    clicks: 2450,
    ctr: 7.5,
    category: "TypeScript",
  },
  {
    id: "4",
    title: "Building Scalable APIs with Node.js",
    views: 29800,
    clicks: 2180,
    ctr: 7.3,
    category: "Node.js",
  },
  {
    id: "5",
    title: "Tailwind CSS Best Practices for 2024",
    views: 27600,
    clicks: 1950,
    ctr: 7.1,
    category: "CSS",
  },
  {
    id: "6",
    title: "PostgreSQL Performance Optimization Tips",
    views: 24300,
    clicks: 1680,
    ctr: 6.9,
    category: "Database",
  },
  {
    id: "7",
    title: "State Management with Zustand vs Redux",
    views: 22100,
    clicks: 1520,
    ctr: 6.9,
    category: "React",
  },
  {
    id: "8",
    title: "Vercel Deployment: A Complete Guide",
    views: 19800,
    clicks: 1340,
    ctr: 6.8,
    category: "DevOps",
  },
]

export const categoryStats = [
  { name: "React", articles: 24, views: 125000, avgCTR: 7.8 },
  { name: "Next.js", articles: 18, views: 98000, avgCTR: 7.6 },
  { name: "TypeScript", articles: 15, views: 82000, avgCTR: 7.4 },
  { name: "Node.js", articles: 12, views: 65000, avgCTR: 7.2 },
  { name: "CSS", articles: 10, views: 54000, avgCTR: 7.0 },
  { name: "Database", articles: 8, views: 42000, avgCTR: 6.9 },
  { name: "DevOps", articles: 6, views: 28000, avgCTR: 6.8 },
]

export interface SocialMediaData {
  date: string
  facebook: number
  linkedin: number
  pinterest: number
  x: number
  instagram: number
}

export const socialMediaTraffic: SocialMediaData[] = [
  { date: "2024-01-01", facebook: 1250, linkedin: 2100, pinterest: 890, x: 1680, instagram: 720 },
  { date: "2024-01-02", facebook: 1420, linkedin: 2350, pinterest: 920, x: 1790, instagram: 810 },
  { date: "2024-01-03", facebook: 1180, linkedin: 1980, pinterest: 850, x: 1520, instagram: 690 },
  { date: "2024-01-04", facebook: 1550, linkedin: 2580, pinterest: 1100, x: 1950, instagram: 920 },
  { date: "2024-01-05", facebook: 1680, linkedin: 2720, pinterest: 1180, x: 2100, instagram: 980 },
  { date: "2024-01-06", facebook: 1490, linkedin: 2420, pinterest: 980, x: 1820, instagram: 850 },
  { date: "2024-01-07", facebook: 1820, linkedin: 2980, pinterest: 1280, x: 2280, instagram: 1050 },
  { date: "2024-01-08", facebook: 1520, linkedin: 2490, pinterest: 1050, x: 1890, instagram: 890 },
  { date: "2024-01-09", facebook: 1680, linkedin: 2650, pinterest: 1120, x: 2050, instagram: 950 },
  { date: "2024-01-10", facebook: 1850, linkedin: 3020, pinterest: 1320, x: 2380, instagram: 1120 },
  { date: "2024-01-11", facebook: 1750, linkedin: 2850, pinterest: 1220, x: 2180, instagram: 1020 },
  { date: "2024-01-12", facebook: 1620, linkedin: 2680, pinterest: 1080, x: 1980, instagram: 920 },
  { date: "2024-01-13", facebook: 1580, linkedin: 2590, pinterest: 1050, x: 1920, instagram: 880 },
  { date: "2024-01-14", facebook: 1950, linkedin: 3180, pinterest: 1420, x: 2520, instagram: 1180 },
]

export const socialMediaStats = [
  { name: "LinkedIn", visits: 36490, engagement: 8.2, growth: 12.5, color: "rgb(10, 102, 194)" },
  { name: "X.com", visits: 28060, engagement: 6.8, growth: 8.3, color: "rgb(0, 0, 0)" },
  { name: "Facebook", visits: 22980, engagement: 5.9, growth: 5.2, color: "rgb(24, 119, 242)" },
  { name: "Pinterest", visits: 15330, engagement: 7.4, growth: 15.8, color: "rgb(230, 0, 35)" },
  { name: "Instagram", visits: 13130, engagement: 6.2, growth: 9.7, color: "rgb(193, 53, 132)" },
]

export const mockArticles = mockTopArticles.map((article, index) => ({
  id: index + 1,
  title: article.title,
  category: article.category,
  views: article.views,
  clicks: article.clicks,
  engagement: Math.random() * 10,
  date: new Date().toISOString().split("T")[0],
}))

export const mockSocialMediaData = socialMediaTraffic.map((item) => ({
  date: item.date,
  facebook: item.facebook,
  linkedin: item.linkedin,
  pinterest: item.pinterest,
  "x.com": item.x,
  instagram: item.instagram,
}))
