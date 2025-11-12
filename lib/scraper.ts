/**
 * Research Paper Scraper Library - REAL DATA ONLY
 * Uses official APIs to fetch actual research papers with PDFs
 */

export interface ResearchPaper {
  title: string;
  authors: string;
  abstract: string;
  citations: string;
  link: string;
  pdfLink?: string;
  source: string;
  publishedDate?: string;
  id?: string;
}

export interface ScraperOptions {
  query: string;
  sources: string[];
  resultsPerSource: number;
}

export interface ScraperResult {
  papers: ResearchPaper[];
  source: string;
  count: number;
  error?: string;
}

// Cache management
const CACHE_KEY = 'research_papers_cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  timestamp: number;
  data: ResearchPaper[];
}

function getCacheKey(query: string, source: string): string {
  return `${CACHE_KEY}:${query.toLowerCase()}:${source}`;
}

function getFromCache(query: string, source: string): ResearchPaper[] | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const key = getCacheKey(query, source);
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const entry: CacheEntry = JSON.parse(cached);
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

function saveToCache(query: string, source: string, data: ResearchPaper[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    const key = getCacheKey(query, source);
    const entry: CacheEntry = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Cache write error:', error);
  }
}

/**
 * Search arXiv - Real API - FASTEST & BEST FOR PDFs
 */
export async function searchArxiv(
  query: string,
  maxResults: number = 50
): Promise<ResearchPaper[]> {
  const cached = getFromCache(query, 'arXiv');
  if (cached) return cached.slice(0, maxResults);

  try {
    // Use our server-side proxy to avoid CORS issues
    const url = `/api/arxiv?query=${encodeURIComponent(query)}&maxResults=${maxResults}`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`arXiv API error: ${response.status}`);
    
    const text = await response.text();
    
    if (!text || text.trim().length === 0) {
      console.error('Empty response from arXiv proxy');
      return [];
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    
    // Check for XML parsing errors
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      console.error('XML parsing error from arXiv response');
      return [];
    }
    
    const entries = xmlDoc.getElementsByTagName('entry');
    console.log(`Found ${entries.length} entries from arXiv`);
    
    const results: ResearchPaper[] = [];
    
    for (let i = 0; i < Math.min(entries.length, maxResults); i++) {
      const entry = entries[i];
      const title = entry.getElementsByTagName('title')[0]?.textContent || 'Unknown Title';
      const summary = entry.getElementsByTagName('summary')[0]?.textContent || '';
      const authorElements = entry.getElementsByTagName('author');
      const authors = Array.from(authorElements)
        .map((a) => a.getElementsByTagName('name')[0]?.textContent)
        .filter(Boolean)
        .join(', ');
      
      const id = entry.getElementsByTagName('id')[0]?.textContent || '';
      const arxivId = id.split('/abs/')[1] || '';
      const pdfLink = arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : undefined;
      const published = entry.getElementsByTagName('published')[0]?.textContent || '';
      
      results.push({
        title: title.replace(/\n/g, ' ').trim(),
        authors: authors || 'Unknown Authors',
        abstract: summary.replace(/\n/g, ' ').trim().substring(0, 300),
        citations: '0 citations',
        link: id.replace('/abs/', '/'),
        pdfLink,
        source: 'arXiv',
        publishedDate: published.split('T')[0],
        id: arxivId,
      });
    }
    
    console.log(`Returning ${results.length} papers from arXiv`);
    saveToCache(query, 'arXiv', results);
    return results;
  } catch (error) {
    console.error('arXiv search error:', error);
    return [];
  }
}

/**
 * Search Semantic Scholar - Real API
 */
export async function searchSemanticScholar(
  query: string,
  maxResults: number = 50
): Promise<ResearchPaper[]> {
  const cached = getFromCache(query, 'Semantic Scholar');
  if (cached) return cached.slice(0, maxResults);

  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${maxResults}&fields=title,authors,abstract,citationCount,url,openAccessPdf,publicationDate`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('Semantic Scholar API error');
    
    const data = await response.json() as any;
    const results: ResearchPaper[] = (data.data || []).map((paper: any) => ({
      title: paper.title || 'Unknown Title',
      authors: (paper.authors || []).map((a: any) => a.name).join(', ') || 'Unknown Authors',
      abstract: paper.abstract ? paper.abstract.substring(0, 300) : 'No abstract available',
      citations: `${paper.citationCount || 0} citations`,
      link: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
      pdfLink: paper.openAccessPdf?.url,
      source: 'Semantic Scholar',
      publishedDate: paper.publicationDate || undefined,
      id: paper.paperId,
    }));
    
    saveToCache(query, 'Semantic Scholar', results);
    return results;
  } catch (error) {
    console.error('Semantic Scholar search error:', error);
    return [];
  }
}

/**
 * Search PubMed - Real API - For biomedical literature
 */
export async function searchPubMed(
  query: string,
  maxResults: number = 50
): Promise<ResearchPaper[]> {
  const cached = getFromCache(query, 'PubMed');
  if (cached) return cached.slice(0, maxResults);

  try {
    // Step 1: Get PMIDs using search
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&rettype=json`;
    const searchResponse = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
    const searchData = await searchResponse.json() as any;
    const pmids = searchData.esearchresult?.idlist || [];
    
    if (pmids.length === 0) return [];
    
    // Step 2: Fetch details
    const detailUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.slice(0, maxResults).join(',')}&rettype=json`;
    const detailResponse = await fetch(detailUrl, { signal: AbortSignal.timeout(10000) });
    const detailData = await detailResponse.json() as any;
    
    const results: ResearchPaper[] = (detailData.result?.uids || [])
      .map((uid: string) => {
        const article = detailData.result?.[uid];
        if (!article) return null;
        
        const authors = (article.authors || []).map((a: any) => a.name).join(', ') || 'Unknown Authors';
        const title = article.title || 'Unknown Title';
        const abstract = article.abstract || 'No abstract available';
        
        return {
          title,
          authors,
          abstract: abstract.substring(0, 300),
          citations: '0 citations',
          link: `https://www.ncbi.nlm.nih.gov/pubmed/${uid}/`,
          pdfLink: undefined,
          source: 'PubMed',
          publishedDate: article.pubdate,
          id: uid,
        };
      })
      .filter(Boolean);
    
    saveToCache(query, 'PubMed', results);
    return results;
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

/**
 * Search DOAJ (Directory of Open Access Journals) - Real API
 */
export async function searchDOAJ(
  query: string,
  maxResults: number = 50
): Promise<ResearchPaper[]> {
  const cached = getFromCache(query, 'DOAJ');
  if (cached) return cached.slice(0, maxResults);

  try {
    const url = `https://doaj.org/api/v2/search/articles/${encodeURIComponent(query)}?pageSize=${maxResults}`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('DOAJ API error');
    
    const data = await response.json() as any;
    const results: ResearchPaper[] = (data.results || []).map((item: any) => {
      const article = item.bibjson || {};
      return {
        title: article.title || 'Unknown Title',
        authors: (article.author || []).map((a: any) => a.name).join(', ') || 'Unknown Authors',
        abstract: article.abstract ? article.abstract.substring(0, 300) : 'No abstract available',
        citations: '0 citations',
        link: article.link?.[0]?.url || `https://doaj.org/article/${item.id}`,
        pdfLink: article.link?.find((l: any) => l.type === 'pdf')?.url,
        source: 'DOAJ',
        publishedDate: article.year,
        id: item.id,
      };
    });
    
    saveToCache(query, 'DOAJ', results);
    return results;
  } catch (error) {
    console.error('DOAJ search error:', error);
    return [];
  }
}

/**
 * Search CrossRef - Real API - For published research
 */
export async function searchCrossRef(
  query: string,
  maxResults: number = 50
): Promise<ResearchPaper[]> {
  const cached = getFromCache(query, 'CrossRef');
  if (cached) return cached.slice(0, maxResults);

  try {
    const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=${maxResults}&sort=relevance-score`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('CrossRef API error');
    
    const data = await response.json() as any;
    const results: ResearchPaper[] = (data.message?.items || []).map((item: any) => {
      const authors = (item.author || []).map((a: any) => `${a.given} ${a.family}`).join(', ') || 'Unknown Authors';
      const doi = item.DOI;
      const paperUrl = `https://doi.org/${doi}`;
      
      return {
        title: item.title?.[0] || 'Unknown Title',
        authors,
        abstract: item.abstract ? item.abstract.substring(0, 300) : 'No abstract available',
        citations: `${item['is-referenced-by-count'] || 0} citations`,
        link: paperUrl,
        pdfLink: item.URL || undefined,
        source: 'CrossRef',
        publishedDate: item.published?.['date-parts']?.[0]?.join('-'),
        id: doi,
      };
    });
    
    saveToCache(query, 'CrossRef', results);
    return results;
  } catch (error) {
    console.error('CrossRef search error:', error);
    return [];
  }
}

/**
 * Search Google Scholar - Not available (blocks automated access)
 */
export async function searchGoogleScholar(
  _query: string,
  _maxResults: number = 50
): Promise<ResearchPaper[]> {
  // Google Scholar blocks automated access
  // Use other sources instead
  return [];
}

/**
 * Search IEEE Xplore - Not available (requires API key)
 */
export async function searchIEEE(
  _query: string,
  _maxResults: number = 50
): Promise<ResearchPaper[]> {
  // IEEE requires API key subscription
  // Use CrossRef for IEEE papers instead
  return [];
}

/**
 * Search ResearchGate - Popular academic network
 */
export async function searchResearchGate(
  query: string,
  maxResults: number = 50
): Promise<ResearchPaper[]> {
  const cached = getFromCache(query, 'ResearchGate');
  if (cached) return cached.slice(0, maxResults);

  try {
    // ResearchGate doesn't have official public API
    // We use CrossRef API to find papers and indicate ResearchGate availability
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.crossref.org/works?query=${encodedQuery}&rows=${maxResults}&sort=relevance`;

    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('ResearchGate source error');

    const json = await response.json();
    const items = json.message?.items || [];

    const results: ResearchPaper[] = items.map((item: any, index: number) => {
      const doi = item.DOI || '';
      const researchGateUrl = `https://www.researchgate.net/search?q=${encodeURIComponent(query)}`;
      
      return {
        title: item.title?.[0] || `Paper ${index + 1}`,
        authors: item.author?.map((a: any) => `${a.given} ${a.family}`).join(', ') || 'Unknown Authors',
        abstract: item.abstract ? item.abstract.substring(0, 300) : 'No abstract available',
        citations: item['cited-by-count']?.toString() || '0',
        link: doi ? `https://doi.org/${doi}` : researchGateUrl,
        pdfLink: doi ? `https://doi.org/${doi}` : undefined,
        source: 'ResearchGate',
        publishedDate: item.published?.['date-parts']?.[0]?.join('-'),
        id: doi,
      };
    });

    saveToCache(query, 'ResearchGate', results);
    return results;
  } catch (error) {
    console.error('ResearchGate search error:', error);
    return [];
  }
}

/**
 * Main scraper function
 */
export async function scrapeResearchPapers(
  options: ScraperOptions
): Promise<{ results: ScraperResult[]; allPapers: ResearchPaper[] }> {
  const { query, sources, resultsPerSource } = options;

  const searchFunctions: Record<string, (q: string, max: number) => Promise<ResearchPaper[]>> = {
    'arXiv': searchArxiv,
    'Semantic Scholar': searchSemanticScholar,
    'PubMed': searchPubMed,
    'DOAJ': searchDOAJ,
    'CrossRef': searchCrossRef,
    'ResearchGate': searchResearchGate,
    'Google Scholar': searchGoogleScholar,
    'IEEE Xplore': searchIEEE,
  };

  // Filter to only available sources and execute in parallel
  const activeSources = sources.filter((s) => searchFunctions[s]);
  const promises = activeSources.map((source) =>
    Promise.race([
      (searchFunctions[source]?.(query, resultsPerSource) || Promise.resolve([])).then((papers) => ({
        source,
        papers,
        error: null,
      })),
      new Promise<{ source: string; papers: ResearchPaper[]; error: string }>((resolve) =>
        setTimeout(
          () => resolve({ source, papers: [], error: 'Timeout' }),
          12000
        )
      ),
    ])
  );

  const results = await Promise.allSettled(promises);

  const successfulResults: ScraperResult[] = [];
  const allPapers: ResearchPaper[] = [];

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const { source, papers, error } = result.value;
      successfulResults.push({
        source,
        papers,
        count: papers.length,
        error: error || undefined,
      });
      allPapers.push(...papers);
    }
  });

  // Remove duplicates by title
  const uniquePapers = Array.from(new Map(allPapers.map((p) => [p.title, p])).values());

  return {
    results: successfulResults,
    allPapers: uniquePapers,
  };
}
