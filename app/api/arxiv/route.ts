/**
 * arXiv Proxy API Route
 * Proxies requests to arXiv API to avoid CORS issues
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const maxResults = searchParams.get('maxResults') || '50';

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400 }
      );
    }

    const encodedQuery = encodeURIComponent(query);
    const arxivUrl = `https://export.arxiv.org/api/query?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;

    console.log('Fetching from arXiv:', arxivUrl);

    const response = await fetch(arxivUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Lumino-Research-Engine/1.0 (compatible; research paper search)',
      },
    });

    if (!response.ok) {
      console.error('arXiv API error:', response.status);
      return new Response(
        JSON.stringify({ error: `arXiv API error: ${response.status}` }),
        { status: response.status }
      );
    }

    const xmlData = await response.text();
    console.log('arXiv response length:', xmlData.length);

    return new Response(xmlData, {
      headers: { 'Content-Type': 'application/xml' },
    });
  } catch (error) {
    console.error('arXiv proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch from arXiv', details: String(error) }),
      { status: 500 }
    );
  }
}
