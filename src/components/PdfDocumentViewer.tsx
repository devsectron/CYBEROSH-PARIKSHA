import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader2,
  AlertCircle,
  Maximize2,
  FileText
} from 'lucide-react';

// Configure the worker source using Vite's URL resolution
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfDocumentViewerProps {
  url: string;
  title: string;
  onDownload?: () => void;
}

export const PdfDocumentViewer: React.FC<PdfDocumentViewerProps> = ({
  url,
  title,
  onDownload
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.25);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPageRendering, setIsPageRendering] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setErrorMsg(null);
    setCurrentPage(1);

    const loadingTask = pdfjsLib.getDocument({
      url,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
      cMapPacked: true
    });

    loadingTask.promise
      .then((loadedDoc: any) => {
        if (isCancelled) return;
        setPdfDoc(loadedDoc);
        setNumPages(loadedDoc.numPages);
        setIsLoading(false);
      })
      .catch((err: any) => {
        if (isCancelled) return;
        console.error('Failed to load PDF via pdfjs:', err);
        setErrorMsg('Unable to render PDF document. You can still download the complete PDF to view offline.');
        setIsLoading(false);
      });

    return () => {
      isCancelled = true;
      try {
        loadingTask.destroy();
      } catch {}
    };
  }, [url]);

  // Render Current Page on Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isMounted = true;
    setIsPageRendering(true);

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}
    }

    pdfDoc
      .getPage(currentPage)
      .then((page: any) => {
        if (!isMounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const viewport = page.getViewport({ scale, rotation });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        renderTask.promise
          .then(() => {
            if (isMounted) setIsPageRendering(false);
          })
          .catch((err: any) => {
            if (err?.name !== 'RenderingCancelledException') {
              console.error('Page render error:', err);
            }
            if (isMounted) setIsPageRendering(false);
          });
      })
      .catch((err: any) => {
        console.error('Error getting page:', err);
        if (isMounted) setIsPageRendering(false);
      });

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, currentPage, scale, rotation]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(prev => prev + 1);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.6));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFitWidth = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 48;
      // standard page width approx 595px
      const targetScale = Math.max(0.7, Math.min(containerWidth / 620, 1.8));
      setScale(targetScale);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-2xl overflow-hidden select-none">
      {/* Top Controls Toolbar */}
      <div className="bg-slate-800/95 border-b border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-10 backdrop-blur-md">
        {/* Page Nav */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Previous Page (Page Up)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 text-xs font-semibold text-slate-200">
            {isLoading ? '...' : `${currentPage} / ${numPages || 1}`}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages || isLoading}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            title="Next Page (Page Down)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.6 || isLoading}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-slate-300">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 2.5 || isLoading}
              className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleFitWidth}
            className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors hidden sm:flex items-center gap-1 text-[11px] px-2.5 font-medium"
            title="Fit to Width"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fit Width</span>
          </button>

          <button
            onClick={handleRotate}
            className="p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            title="Rotate Page"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Quick jump to answer key (usually on the last 2 pages) */}
          {numPages > 2 && (
            <button
              onClick={() => {
                setCurrentPage(Math.max(1, numPages - 1));
                containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold transition-colors hidden md:block"
            >
              Jump to Answer Key
            </button>
          )}
        </div>

        {/* Download action */}
        {onDownload && (
          <button
            onClick={onDownload}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>
        )}
      </div>

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-start bg-slate-950/70"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center my-auto p-8 space-y-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <p className="text-sm text-slate-300 font-medium">Loading document via high-res PDF renderer...</p>
            <p className="text-xs text-slate-500">BSEB Intermediate Class 12 Computer Science Paper</p>
          </div>
        )}

        {errorMsg && (
          <div className="flex flex-col items-center justify-center my-auto p-8 max-w-md text-center space-y-4 bg-slate-900 rounded-2xl border border-slate-800">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Renderer Notice</h4>
              <p className="text-xs text-slate-400">{errorMsg}</p>
            </div>
            {onDownload && (
              <button
                onClick={onDownload}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Download Complete PDF</span>
              </button>
            )}
          </div>
        )}

        <div className={`relative transition-opacity duration-150 ${isLoading || errorMsg ? 'hidden' : 'block'}`}>
          {isPageRendering && (
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          )}

          <canvas
            ref={canvasRef}
            className="rounded-lg shadow-2xl bg-white max-w-full ring-1 ring-slate-800"
          />
        </div>

        {/* Page status footer inside document */}
        {!isLoading && !errorMsg && (
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400 pb-2">
            <span>Page {currentPage} of {numPages}</span>
            <span>•</span>
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="hover:text-blue-400 disabled:opacity-30 underline cursor-pointer"
            >
              Previous Page
            </button>
            <span>•</span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              className="hover:text-blue-400 disabled:opacity-30 underline cursor-pointer"
            >
              Next Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
