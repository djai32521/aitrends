import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysisResult, TrendItem } from "../types";

import { decryptKey } from "../utils/crypto";

const getApiKey = () => {
  // 1. Try encrypted key (Deployment / Secure)
  const encrypted = import.meta.env.VITE_GEMINI_API_KEY_ENCRYPTED;
  if (encrypted) return decryptKey(encrypted);

  // 2. Try plain key (Dev / Legacy)
  if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;

  // 3. Fallback to process.env (Existing setup support)
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) return process.env.API_KEY;

  return null;
}

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

export const analyzeTrendWithGemini = async (
  trend: TrendItem
): Promise<GeminiAnalysisResult> => {

  if (!apiKey || !ai) {
    return {
      summary: "API 키가 설정되지 않아 AI 분석을 수행할 수 없습니다. .env 파일에 API_KEY를 설정해주세요.",
      reason: "API Key Missing",
      tags: ["Error", "Config"]
    };
  }

  try {
    // Construct context from News Items if available, otherwise fallback to description
    let contextData = "";
    if (trend.newsItems && trend.newsItems.length > 0) {
      contextData = trend.newsItems.map((news, idx) =>
        `Article ${idx + 1}:\nTitle: ${news.title}\nSource: ${news.source}\nSnippet: ${news.snippet}`
      ).join("\n\n");
    } else {
      contextData = trend.description || "No specific details available.";
    }

    const prompt = `
      Analyze the following trending topic in South Korea based on the provided news articles.
      
      Topic: ${trend.title}
      
      Relevant News Context:
      ${contextData}

      Provide a JSON response with the following fields:
      1. 'summary': A concise, natural summary explaining WHY this is trending right now (in Korean). Use the news details to be specific.
      2. 'reason': The core category or driver (e.g., "Breaking News", "Entertainment", "Sports", "Politics") (in Korean).
      3. 'tags': 3 relevant and specific keywords/hashtags (in Korean). Do NOT include the '#' symbol in the strings.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            reason: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "reason", "tags"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeminiAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "현재 트래픽이 많거나 데이터를 분석할 수 없습니다. 잠시 후 다시 시도해주세요.",
      reason: "Analysis Unavailable",
      tags: ["오류", "재시도"]
    };
  }
};

export const translateTrendsToKorean = async (trends: TrendItem[]): Promise<TrendItem[]> => {
  if (!apiKey || !ai) return trends;

  try {
    // Prepare a minimized payload to save tokens and latency
    // We translate the Trend Title and the titles of the first 2 news items
    const payload = trends.map((t, index) => ({
      id: index,
      t: t.title,
      n: t.newsItems?.slice(0, 2).map(n => n.title) || []
    }));

    const prompt = `
            You are a professional news translator. Translate the following list of trending topics and news headlines from their source language (English, Japanese, French, etc.) to Korean.
            - Ensure the translation is natural and suitable for a news dashboard.
            - Maintain the proper nouns (names of people, companies) correctly in Korean.
            
            Input JSON: ${JSON.stringify(payload)}
            
            Return ONLY a JSON array with the exact same structure:
            [{ "id": number, "t": "Korean Title", "n": ["Korean News 1", "Korean News 2"] }, ...]
        `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return trends;

    const translations = JSON.parse(text);

    // Map translations back to the original trends objects
    // We create a shallow copy of trends and update titles/news titles
    return trends.map((trend, index) => {
      const trans = translations.find((tr: any) => tr.id === index);
      if (!trans) return trend;

      const newNewsItems = trend.newsItems ? [...trend.newsItems] : [];
      // Update news titles
      if (trans.n && Array.isArray(trans.n)) {
        trans.n.forEach((translatedTitle: string, idx: number) => {
          if (newNewsItems[idx]) {
            newNewsItems[idx] = { ...newNewsItems[idx], title: translatedTitle };
          }
        });
      }

      return {
        ...trend,
        title: trans.t || trend.title,
        newsItems: newNewsItems
      };
    });

  } catch (error) {
    console.error("Translation Error:", error);
    return trends; // Fallback to original if translation fails
  }
};

export const generateBlogPost = async (trends: TrendItem[]): Promise<string> => {
  if (!apiKey || !ai) return "API 키가 설정되지 않았습니다.";

  // Take top 10 trends
  const topTrends = trends.slice(0, 10);
  const dateStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

  // Prepare minimized context
  const context = topTrends.map((t, i) =>
    `${i + 1}. ${t.title} (Traffic: ${t.approx_traffic})\n   Info: ${t.newsItems?.[0]?.title || t.description}`
  ).join("\n\n");

  const prompt = `
        You are a professional Tech & Lifestyle blogger in South Korea.
        Write a blog post about today's top 10 real-time search trends.
        
        Target Date: ${dateStr}
        Target Time: ${timeStr}
        
        Trends Data:
        ${context}
        
        Requirements:
        1. **Format**: Use **Markdown** format.
        2. **Title**: Catchy, includes date (${dateStr}) and time (${timeStr}). (e.g., [${dateStr} ${timeStr}] 실시간 트렌드 총정리)
        3. **Structure**:
           - **Introduction**: Mention the current date and time explicitly.
           - **Image Placeholder**: Insert "![Today's Trends]({{SCREENSHOT_PLACEHOLDER}})" after intro.
           - **Body**: List Top 10 trends.
           - **Conclusion**: Wrap up.
           - **Hashtags**: List at end.
        
        Style:
        - "해요체" (friendly polite).
        - Short paragraphs.
    `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });

    let content = response.text || "";
    content = content.replace(/^```markdown\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');

    return content;
  } catch (error) {
    console.error("Blog Generation Error:", error);
    return "블로그 글을 생성하는 중 오류가 발생했습니다.";
  }
};