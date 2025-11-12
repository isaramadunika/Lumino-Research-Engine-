'use client';

/* stylelint-disable */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import styles from './PDFViewer.module.css';

interface PDFViewerProps {
  pdfUrl: string;
}

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [pageNum, setPageNum] = useState(1);
  const [scale, setScale] = useState(1);

  // Use iframe for PDF viewing (fallback approach)
  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Controls */}
      <div className="bg-slate-800 border-b border-white/10 p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="page-input" className="text-sm text-gray-300">Page</label>
          <input
            id="page-input"
            type="number"
            value={pageNum}
            onChange={(e) => setPageNum(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 px-2 py-1 bg-slate-700 border border-white/20 rounded text-white text-center text-sm"
            min="1"
            placeholder="1"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.2))}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-300 w-12 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(Math.min(3, scale + 0.2))}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <button
            onClick={() => {}}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          Open Original
        </a>
      </div>

      {/* PDF Container */}
      <div className="flex-1 overflow-auto bg-gray-950 flex items-start justify-center p-4">
        {/* eslint-disable-next-line react/no-unknown-property */}
        <div
          className={`${styles.pdfScaleContainer} bg-white rounded shadow-lg`}
          style={{ transform: `scale(${scale})` } as React.CSSProperties}
        >
          <iframe
            src={`${pdfUrl}#page=${pageNum}`}
            className={styles.pdfIframe}
            title="PDF Viewer"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-800 border-t border-white/10 p-4 flex items-center justify-center gap-4">
        <button
          onClick={() => setPageNum(Math.max(1, pageNum - 1))}
          disabled={pageNum <= 1}
          className="p-2 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
          title="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-sm text-gray-300">
          {pageNum} pages (estimated)
        </span>

        <button
          onClick={() => setPageNum(pageNum + 1)}
          className="p-2 hover:bg-slate-700 rounded transition-colors"
          title="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="text-xs text-gray-500 ml-4">
          Tip: Use browser PDF viewer for best experience
        </div>
      </div>
    </div>
  );
}
