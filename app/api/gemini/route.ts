/**
 * Gemini API Route Handler
 * Handles Gemini API calls from the client
 */

export async function POST(request: Request) {
  const body = await request.json();
  const { action, userQuery, paperTitle, paperAbstract, papers } = body;

  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Gemini API key not configured' }),
      { status: 500 }
    );
  }

  try {
    let prompt = '';

    if (action === 'getSearchSuggestions') {
      prompt = `You are an academic research expert. The user is searching for research papers. 
    
User's search query: "${userQuery}"

Provide 3 refined search suggestions that would improve their research discovery. For each suggestion, provide:
1. The refined search term
2. A brief reason why this search is useful
3. Up to 3 related academic topics

Format your response as a JSON array with objects containing: suggestion, reasoning, relatedTopics

Example format:
[
  {
    "suggestion": "refined search term",
    "reasoning": "why this helps",
    "relatedTopics": ["topic1", "topic2", "topic3"]
  }
]

Only respond with valid JSON, no additional text.`;
    } else if (action === 'analyzePaper') {
      prompt = `You are an academic research expert. Analyze this research paper:

Title: "${paperTitle}"
Abstract: "${paperAbstract}"

Provide a structured analysis with:
1. A 2-3 sentence summary of the paper's main contribution
2. Key points (3-5 bullet points)
3. A relevance score (0-100) for general academic interest
4. A suggested related search query

Format your response as JSON with keys: summary, keyPoints (array), relevanceScore (number), suggestedRelatedSearch

Only respond with valid JSON, no additional text.`;
    } else if (action === 'generateResearchInsights') {
      const papersText = papers
        .slice(0, 10)
        .map(
          (p: any, i: number) =>
            `${i + 1}. Title: "${p.title}" (from ${p.source})\n   Abstract: "${p.abstract.substring(0, 200)}..."`
        )
        .join('\n\n');

      prompt = `You are an academic research expert. Analyze these research papers and provide key insights:

${papersText}

Provide a comprehensive analysis that includes:
1. Common themes across the papers
2. Key research directions
3. Gaps or areas for future research
4. Overall trends in the field

Keep the analysis concise but insightful (2-3 paragraphs).`;
    }

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error response:', errorData);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.status}`, details: errorData }),
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'No content from Gemini API' }),
        { status: 500 }
      );
    }

    if (action === 'generateResearchInsights') {
      // For insights, return the text directly
      return new Response(JSON.stringify({ insights: content }), { status: 200 });
    } else {
      // For suggestions and analysis, parse JSON
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify({ error: 'Could not parse JSON from Gemini response' }),
          { status: 500 }
        );
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return new Response(JSON.stringify(parsed), { status: 200 });
    }
  } catch (error) {
    console.error('Gemini API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500 }
    );
  }
}
