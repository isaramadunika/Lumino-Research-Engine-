/**
 * Gemini AI Integration for Research Paper Search
 * Uses our API route to call Google's Gemini API securely
 */

export interface SearchSuggestion {
  suggestion: string;
  reasoning: string;
  relatedTopics: string[];
}

export interface PaperAnalysis {
  summary: string;
  keyPoints: string[];
  relevanceScore: number;
  suggestedRelatedSearch: string;
}

/**
 * Get intelligent search suggestions from Gemini AI
 */
export async function getSearchSuggestions(
  userQuery: string
): Promise<SearchSuggestion[]> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getSearchSuggestions',
        userQuery,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data as SearchSuggestion[];
    }
    
    return [];
  } catch (error) {
    console.error('Search suggestions error:', error);
    return [];
  }
}

/**
 * Analyze a research paper using Gemini AI
 */
export async function analyzePaper(
  paperTitle: string,
  paperAbstract: string
): Promise<PaperAnalysis | null> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'analyzePaper',
        paperTitle,
        paperAbstract,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    return data as PaperAnalysis;
  } catch (error) {
    console.error('Paper analysis error:', error);
    return null;
  }
}

/**
 * Generate research insights from multiple papers
 */
export async function generateResearchInsights(
  papers: Array<{ title: string; abstract: string; source: string }>
): Promise<string> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generateResearchInsights',
        papers,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${response.status} - ${errorData.error}`);
    }

    const data = await response.json();
    return data.insights || 'Unable to generate insights at this time';
  } catch (error) {
    console.error('Research insights error:', error);
    return 'Error generating insights';
  }
}
