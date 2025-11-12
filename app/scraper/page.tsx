'use client';

/* stylelint-disable */

import React, { useState, useCallback, useMemo, Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { scrapeResearchPapers, ResearchPaper } from '@/lib/scraper';
import { getSearchSuggestions, analyzePaper, generateResearchInsights, SearchSuggestion, PaperAnalysis } from '@/lib/gemini-search';
import { Search, Download, ExternalLink, Loader, FileText, X, Clock, Trash2, Copy, CheckCircle, Lightbulb, Brain, Sparkles } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PDFViewer = dynamic(
  () => import('@/components/PDFViewer'),
  { ssr: false, loading: () => <div className="p-8 text-center text-gray-400">Loading PDF viewer...</div> }
) as any;

interface SearchHistory {
  id: string;
  query: string;
  sources: string[];
  timestamp: number;
  paperCount: number;
  papers: ResearchPaper[];
}

export default function ResearchScraperPage() {
  const [query, setQuery] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>(['arXiv', 'Semantic Scholar', 'CrossRef']);
  const [resultsPerSource, setResultsPerSource] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [sourceStats, setSourceStats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'results' | 'charts' | 'history' | 'insights'>('results');
  const [selectedPDF, setSelectedPDF] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedPaperAnalysis, setSelectedPaperAnalysis] = useState<PaperAnalysis | null>(null);
  const [researchInsights, setResearchInsights] = useState<string | null>(null);

  const availableSources = ['arXiv', 'Semantic Scholar', 'PubMed', 'DOAJ', 'CrossRef', 'ResearchGate'];

  // Load search history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('research_search_history');
    if (stored) {
      try {
        setSearchHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchToHistory = useCallback((query: string, sources: string[], papers: ResearchPaper[]) => {
    const newSearch: SearchHistory = {
      id: Date.now().toString(),
      query,
      sources,
      timestamp: Date.now(),
      paperCount: papers.length,
      papers,
    };

    setSearchHistory((prev) => {
      const updated = [newSearch, ...prev].slice(0, 20); // Keep last 20 searches
      localStorage.setItem('research_search_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Load search from history
  const loadFromHistory = useCallback((search: SearchHistory) => {
    setPapers(search.papers);
    setQuery(search.query);
    setSelectedSources(search.sources);
    setSourceStats(
      search.papers
        .reduce((acc: any, paper) => {
          const existing = acc.find((s: any) => s.name === paper.source);
          if (existing) {
            existing.papers += 1;
          } else {
            acc.push({ name: paper.source, papers: 1, error: null });
          }
          return acc;
        }, [])
    );
    setActiveTab('results');
    setShowHistory(false);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    if (window.confirm('Are you sure? This will delete all search history.')) {
      setSearchHistory([]);
      localStorage.removeItem('research_search_history');
    }
  }, []);

  const handleSourceToggle = useCallback((source: string) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  }, []);

  // Get AI search suggestions
  const handleGetAISuggestions = useCallback(async () => {
    if (!query.trim()) {
      alert('Please enter a search query first');
      return;
    }

    setLoadingAI(true);
    try {
      const suggestionsData = await getSearchSuggestions(query);
      setSuggestions(suggestionsData);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      alert('Failed to get AI suggestions');
    } finally {
      setLoadingAI(false);
    }
  }, [query]);

  // Analyze selected paper with Gemini
  const handleAnalyzePaper = useCallback(async (paper: ResearchPaper) => {
    setLoadingAI(true);
    try {
      const analysis = await analyzePaper(paper.title, paper.abstract);
      setSelectedPaperAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing paper:', error);
      alert('Failed to analyze paper');
    } finally {
      setLoadingAI(false);
    }
  }, []);

  // Generate insights from current results
  const handleGenerateInsights = useCallback(async () => {
    if (papers.length === 0) {
      alert('No papers to analyze. Search first!');
      return;
    }

    setLoadingAI(true);
    try {
      const insights = await generateResearchInsights(
        papers.map((p) => ({
          title: p.title,
          abstract: p.abstract,
          source: p.source,
        }))
      );
      setResearchInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
      alert('Failed to generate insights');
    } finally {
      setLoadingAI(false);
    }
  }, [papers]);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || selectedSources.length === 0) {
      alert('Please enter a query and select at least one source');
      return;
    }

    setIsLoading(true);
    setSearchProgress(0);

    try {
      const { results, allPapers } = await scrapeResearchPapers({
        query,
        sources: selectedSources,
        resultsPerSource,
      });

      setPapers(allPapers);
      setSourceStats(
        results.map((r: any) => ({
          name: r.source,
          papers: r.count,
          error: r.error || null,
        }))
      );
      setActiveTab('results');
      setSearchProgress(100);
      saveSearchToHistory(query, selectedSources, allPapers);
    } catch (error) {
      console.error('Search error:', error);
      alert('An error occurred during search');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setSearchProgress(0);
      }, 500);
    }
  }, [query, selectedSources, resultsPerSource, saveSearchToHistory]);

  const downloadCSV = useCallback(() => {
    const headers = ['Title', 'Authors', 'Abstract', 'Source', 'Link', 'Published Date'];
    const rows = papers.map((p) => [
      p.title,
      p.authors,
      p.abstract,
      p.source,
      p.link,
      p.publishedDate || 'N/A',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `research-papers-${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [papers]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Background animations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-900/10"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header - Glassmorphism */}
      <div className="relative bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Lumino Research Engine
                </h1>
                <p className="text-gray-400 text-sm">Search and analyze academic papers</p>
              </div>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 rounded-lg transition-all flex items-center gap-2 group"
            >
              <Clock className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
              <span className="text-sm">History ({searchHistory.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - History */}
          {showHistory && (
            <div className="lg:col-span-1">
              <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-4 sticky top-32">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Search History</h3>
                  {searchHistory.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="p-1 hover:bg-red-900/30 rounded transition-colors"
                      title="Clear history"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  )}
                </div>

                {searchHistory.length === 0 ? (
                  <p className="text-sm text-gray-400">No search history yet</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchHistory.map((search) => (
                      <div
                        key={search.id}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all group border border-white/10 hover:border-blue-400/50"
                        onClick={() => loadFromHistory(search)}
                      >
                        <div className="text-sm font-medium text-blue-300 line-clamp-1 group-hover:text-blue-200">
                          {search.query}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(search.timestamp).toLocaleDateString()} • {search.paperCount} papers
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {search.sources.map((src) => (
                            <span key={src} className="px-1.5 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded">
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={showHistory ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {/* Search Panel - Glassmorphism */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 mb-8 shadow-xl">
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Query Input */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-200">Research Topic</label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="e.g., machine learning, climate change, quantum computing..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-5 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 transition-all group-hover:bg-white/15 text-white placeholder-gray-400"
                    />
                    <Search className="absolute right-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Source Selection - Enhanced Grid */}
                <div>
                  <label className="block text-sm font-semibold mb-4 text-gray-200">Research Sources</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {availableSources.map((source) => (
                      <label
                        key={source}
                        className="relative flex items-center cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source)}
                          onChange={() => handleSourceToggle(source)}
                          disabled={isLoading}
                          className="sr-only"
                        />
                        <div className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 group-hover:border-blue-400/50 transition-all w-full text-center text-sm font-medium disabled:opacity-50 group-has-[:checked]:bg-blue-500/30 group-has-[:checked]:border-blue-400 group-has-[:checked]:text-blue-300">
                          {source}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Results Per Source & Search Button */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="results-select" className="block text-sm font-semibold mb-2 text-gray-200">
                      Results Per Source
                    </label>
                    <select
                      id="results-select"
                      value={resultsPerSource}
                      onChange={(e) => setResultsPerSource(parseInt(e.target.value))}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 disabled:opacity-50 transition-all text-white"
                    >
                      <option value={5}>5 papers</option>
                      <option value={10}>10 papers</option>
                      <option value={20}>20 papers</option>
                      <option value={50}>50 papers</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-end gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-600 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100"
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Searching... {Math.round(searchProgress)}%
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Search Papers
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {isLoading && (
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-400 to-purple-400 h-full transition-all duration-300"
                      style={{ width: `${Math.min(searchProgress, 100)}%` } as React.CSSProperties}
                    ></div>
                  </div>
                )}

                {/* AI Suggestions Button */}
                <div className="flex gap-2">
                  <button
                    onClick={handleGetAISuggestions}
                    disabled={loadingAI || !query.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100"
                  >
                    {loadingAI ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        AI Processing...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4" />
                        AI Search Tips
                      </>
                    )}
                  </button>
                </div>

                {/* AI Suggestions Display */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-400/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h4 className="font-semibold text-amber-200">AI Search Suggestions</h4>
                    </div>
                    <div className="space-y-3">
                      {suggestions.map((sugg, idx) => (
                        <div key={idx} className="bg-white/5 border border-amber-400/20 rounded-lg p-3">
                          <button
                            onClick={() => {
                              setQuery(sugg.suggestion);
                              setShowSuggestions(false);
                            }}
                            className="text-left w-full hover:text-amber-300 transition-colors"
                          >
                            <div className="font-medium text-amber-200">{sugg.suggestion}</div>
                            <div className="text-sm text-gray-300 mt-1">{sugg.reasoning}</div>
                            {sugg.relatedTopics.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {sugg.relatedTopics.map((topic) => (
                                  <span key={topic} className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded">
                                    {topic}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Results Section */}
            {papers.length > 0 && (
              <div className="space-y-6">
                {/* Stats Grid - Glassmorphism */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Papers', value: papers.length, color: 'from-blue-400 to-blue-600' },
                    { label: 'Sources', value: sourceStats.length, color: 'from-purple-400 to-purple-600' },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all"
                    >
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                  <button
                    onClick={downloadCSV}
                    className="col-span-2 md:col-span-1 px-4 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </button>
                  <button
                    onClick={handleGenerateInsights}
                    disabled={loadingAI || papers.length === 0}
                    className="col-span-2 md:col-span-1 px-4 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:scale-100"
                  >
                    {loadingAI ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        AI Insights
                      </>
                    )}
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white/5 backdrop-blur border border-white/20 rounded-xl p-1 w-fit">
                  {[
                    { id: 'results', label: `Results (${papers.length})` },
                    { id: 'charts', label: 'Analytics' },
                    { id: 'history', label: 'History' },
                    { id: 'insights', label: 'Insights' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Results Tab */}
                {activeTab === 'results' && (
                  <div className="space-y-3">
                    {papers.map((paper, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-5 hover:bg-white/10 hover:border-blue-400/50 transition-all group"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <a
                              href={paper.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent hover:from-blue-300 hover:to-blue-200 transition-all line-clamp-2"
                            >
                              {paper.title}
                            </a>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-1">{paper.authors}</p>
                            <p className="text-sm text-gray-300 mt-2 line-clamp-2">{paper.abstract}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-400/30">
                                {paper.source}
                              </span>
                              {paper.publishedDate && (
                                <span className="px-3 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full border border-gray-400/30">
                                  📅 {paper.publishedDate}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {paper.pdfLink && (
                              <button
                                onClick={() => setSelectedPDF(paper.pdfLink || null)}
                                className="p-2 bg-orange-500/20 text-orange-400 border border-orange-400/30 rounded-lg hover:bg-orange-500/30 transition-all"
                                title="View PDF"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                            )}
                            <a
                              href={paper.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-lg hover:bg-blue-500/30 transition-all"
                              title="Open paper"
                            >
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Charts Tab */}
                {activeTab === 'charts' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Papers by Source</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sourceStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                          <YAxis stroke="rgba(255,255,255,0.5)" />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                          <Bar dataKey="papers" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4">Source Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={sourceStats.filter((s) => s.papers > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, papers: count }) => `${name}: ${count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="papers"
                          >
                            {sourceStats.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#06b6d4'][index % 7]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-6 lg:col-span-2">
                      <h3 className="text-lg font-semibold mb-4">Detailed Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {sourceStats.map((stat, idx) => (
                          <div key={idx} className="bg-white/5 border border-white/20 rounded-lg p-4">
                            <p className="text-gray-400 text-sm">{stat.name}</p>
                            <p className="text-2xl font-bold text-blue-400 mt-1">{stat.papers}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {stat.error ? '❌ Error' : `${papers.length > 0 ? ((stat.papers / papers.length) * 100).toFixed(1) : 0}% of total`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-3">
                    {searchHistory.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-400">No search history yet</p>
                      </div>
                    ) : (
                      searchHistory.map((search) => (
                        <div
                          key={search.id}
                          className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-4 hover:bg-white/10 transition-all"
                        >
                          <div className="flex justify-between items-start">
                            <div
                              className="flex-1 cursor-pointer"
                              onClick={() => loadFromHistory(search)}
                            >
                              <div className="font-semibold text-blue-300 hover:text-blue-200 transition-colors">
                                {search.query}
                              </div>
                              <div className="text-sm text-gray-400 mt-1">
                                {new Date(search.timestamp).toLocaleString()} • {search.paperCount} papers
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {search.sources.map((src) => (
                                  <span key={src} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-400/30">
                                    {src}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(search.query);
                                setCopiedId(search.id);
                                setTimeout(() => setCopiedId(null), 2000);
                              }}
                              className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors ml-2"
                            >
                              {copiedId === search.id ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* AI Insights Tab */}
                {activeTab === 'insights' && (
                  <div className="space-y-4">
                    {researchInsights ? (
                      <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-400/30 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Brain className="w-5 h-5 text-cyan-400" />
                          <h3 className="font-semibold text-lg text-cyan-200">AI Research Insights</h3>
                        </div>
                        <div className="prose prose-invert max-w-none">
                          <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {researchInsights}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-400">Click "AI Insights" button to analyze research trends</p>
                      </div>
                    )}

                    {/* Individual Paper Analysis */}
                    {papers.length > 0 && (
                      <div className="space-y-3 mt-6">
                        <h4 className="font-semibold text-lg mb-4">Analyze Papers with AI</h4>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {papers.slice(0, 5).map((paper, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleAnalyzePaper(paper)}
                              disabled={loadingAI}
                              className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-cyan-400/50 rounded-lg transition-all disabled:opacity-50"
                            >
                              <div className="font-medium text-cyan-300 line-clamp-1">{paper.title}</div>
                              <div className="text-xs text-gray-400 mt-1">Click to analyze with AI</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && papers.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-block p-4 bg-white/5 rounded-full mb-4">
                  <Search className="w-12 h-12 text-gray-600 opacity-50" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-300 mb-2">Ready to Search</h3>
                <p className="text-gray-400">Enter a research topic and select sources to discover academic papers</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal - Glassmorphism */}
      {selectedPDF && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20 shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <h3 className="text-lg font-semibold">PDF Viewer</h3>
              <button
                onClick={() => setSelectedPDF(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <PDFViewer pdfUrl={selectedPDF} />
            </div>
          </div>
        </div>
      )}

      {/* Paper Analysis Modal - Glassmorphism */}
      {selectedPaperAnalysis && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col border border-white/20 shadow-2xl max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold">AI Paper Analysis</h3>
              </div>
              <button
                onClick={() => setSelectedPaperAnalysis(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Summary */}
              <div>
                <h4 className="font-semibold text-cyan-300 mb-2">Summary</h4>
                <p className="text-gray-200">{selectedPaperAnalysis.summary}</p>
              </div>

              {/* Key Points */}
              <div>
                <h4 className="font-semibold text-cyan-300 mb-2">Key Points</h4>
                <ul className="space-y-1">
                  {selectedPaperAnalysis.keyPoints.map((point, idx) => (
                    <li key={idx} className="text-gray-200 flex gap-2">
                      <span className="text-cyan-400">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Relevance Score */}
              <div>
                <h4 className="font-semibold text-cyan-300 mb-2">Relevance Score</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-400 to-blue-400 h-full transition-all"
                      style={{ width: `${selectedPaperAnalysis.relevanceScore}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-cyan-300 w-12 text-right">
                    {selectedPaperAnalysis.relevanceScore}%
                  </span>
                </div>
              </div>

              {/* Related Search */}
              <div>
                <h4 className="font-semibold text-cyan-300 mb-2">Related Search</h4>
                <button
                  onClick={() => {
                    setQuery(selectedPaperAnalysis.suggestedRelatedSearch);
                    setSelectedPaperAnalysis(null);
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-lg text-sm font-medium transition-all"
                >
                  Search: {selectedPaperAnalysis.suggestedRelatedSearch}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
