export interface TrendItem {
  title: string;
  link: string;
  pubDate: string;
  approx_traffic?: string; // Often comes from ht:approx_traffic
  description?: string;
  imageUrl?: string;
  source?: string;
  newsItems?: NewsItem[];
}

export interface NewsItem {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

export interface RssFeedResponse {
  status: string;
  feed: {
    url: string;
    title: string;
    link: string;
    author: string;
    description: string;
    image: string;
  };
  items: RssItemRaw[];
}

// Type for the raw item from rss2json
export interface RssItemRaw {
  title: string;
  pubDate: string;
  link: string;
  guid: string;
  author: string;
  thumbnail: string;
  description: string;
  content: string;
  enclosure: object;
  categories: string[];
}

export interface GeminiAnalysisResult {
  summary: string;
  reason: string;
  tags: string[];
}