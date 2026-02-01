import { TrendItem, NewsItem } from '../types';

// We now accept a geo parameter to switch between countries
export const fetchTrends = async (geo: string = 'KR'): Promise<TrendItem[]> => {
  // Use .com for better global consistency
  const RSS_URL = `https://trends.google.com/trending/rss?geo=${geo}`;

  // Helper to parse XML string into TrendItems
  const parseXml = (xmlString: string): TrendItem[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    const items = xmlDoc.querySelectorAll("item");

    if (items.length === 0) return [];

    return Array.from(items).map((item) => {
      const title = item.querySelector("title")?.textContent || "No Title";
      const link = item.querySelector("link")?.textContent || "#";
      const pubDate = item.querySelector("pubDate")?.textContent || new Date().toISOString();
      const description = item.querySelector("description")?.textContent || "";

      // Google Trends Custom Tags (ht namespace)
      const approx_traffic = item.querySelector("approx_traffic")?.textContent ||
        item.getElementsByTagName("ht:approx_traffic")[0]?.textContent || "";

      const picture = item.querySelector("picture")?.textContent ||
        item.getElementsByTagName("ht:picture")[0]?.textContent || "";

      const pictureSource = item.querySelector("picture_source")?.textContent ||
        item.getElementsByTagName("ht:picture_source")[0]?.textContent || "";

      // Parse News Items
      const newsItemNodes = item.getElementsByTagName("ht:news_item");
      const newsItems: NewsItem[] = Array.from(newsItemNodes).map(node => ({
        title: node.querySelector("news_item_title")?.textContent ||
          node.getElementsByTagName("ht:news_item_title")[0]?.textContent || "",
        snippet: node.querySelector("news_item_snippet")?.textContent ||
          node.getElementsByTagName("ht:news_item_snippet")[0]?.textContent || "",
        url: node.querySelector("news_item_url")?.textContent ||
          node.getElementsByTagName("ht:news_item_url")[0]?.textContent || "#",
        source: node.querySelector("news_item_source")?.textContent ||
          node.getElementsByTagName("ht:news_item_source")[0]?.textContent || ""
      }));

      // Fallback for image
      let finalImageUrl = picture;
      if (!finalImageUrl) {
        const imgMatch = description.match(/src="([^"]+)"/);
        if (imgMatch) finalImageUrl = imgMatch[1];
        else finalImageUrl = `https://picsum.photos/seed/${encodeURIComponent(title)}/600/400`;
      }

      // Cleanup description for display fallback
      const cleanDesc = description.replace(/<[^>]*>?/gm, '').trim();

      return {
        title,
        link,
        pubDate,
        description: cleanDesc,
        imageUrl: finalImageUrl,
        approx_traffic: approx_traffic,
        source: pictureSource || "Google Trends",
        newsItems: newsItems
      };
    });
  };

  // Mock data to use if ALL fetches fail
  const MOCK_DATA: TrendItem[] = [
    {
      title: "Google Trends API Unavailable",
      link: "#",
      pubDate: new Date().toISOString(),
      approx_traffic: "N/A",
      imageUrl: "https://picsum.photos/800/600?grayscale",
      description: "Unable to fetch real-time data due to network restrictions or CORS issues. Please try again later.",
      source: "System",
      newsItems: []
    }
  ];

  try {
    // Strategy 1: Custom Nginx Proxy (djai.shop)
    // configured to reverse proxy to Google Trends RSS
    const nginxProxyUrl = `https://djai.shop/rss-proxy?geo=${geo}&t=${Date.now()}`;

    const response = await fetch(nginxProxyUrl);
    if (!response.ok) {
      throw new Error(`Custom proxy failed: ${response.status} ${response.statusText}`);
    }

    const xmlText = await response.text();
    // Minimal validation that we got XML
    if (xmlText.includes('<rss') || xmlText.includes('<channel>')) {
      return parseXml(xmlText);
    }
    throw new Error("Invalid RSS feed received");

  } catch (error) {
    console.error("Error fetching trends via customized proxy:", error);
    return MOCK_DATA;
  }
};