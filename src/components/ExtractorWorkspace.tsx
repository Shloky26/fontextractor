import {
  AlertCircle,
  ClipboardPaste,
  Globe,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Type,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SAMPLE_IMAGE_PRESETS, SAMPLE_URL_PRESETS } from '../data/samples.ts';
import type { ExtractionResult } from '../types/font.ts';
import { FontResultCard } from './FontResultCard.tsx';

export type ExtractorMode = 'url' | 'image';

interface ExtractorWorkspaceProps {
  mode: ExtractorMode;
  onModeChange: (mode: ExtractorMode) => void;
  urlInputRef: React.RefObject<HTMLInputElement | null>;
}

interface LoadedImagePreview {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  dimensions?: string;
}

const REQUEST_TIMEOUT_MS = 25_000;
const IMAGE_REQUEST_TIMEOUT_MS = 50_000;
const MAX_UPLOAD_DIMENSION = 1024;
const JPEG_QUALITY = 0.8;
const HIGH_DEMAND_MESSAGE =
  'The font-matching model is currently experiencing high demand. Please wait a moment and try again.';

async function compressImageForUpload(
  dataUrl: string,
  maxDimension = MAX_UPLOAD_DIMENSION,
  quality = JPEG_QUALITY,
): Promise<{ dataUrl: string; mimeType: 'image/jpeg' }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const srcWidth = img.naturalWidth || img.width;
      const srcHeight = img.naturalHeight || img.height;
      if (!srcWidth || !srcHeight) {
        reject(new Error('Could not read image dimensions.'));
        return;
      }

      const largest = Math.max(srcWidth, srcHeight);
      const scale = largest > maxDimension ? maxDimension / largest : 1;
      const targetWidth = Math.max(1, Math.round(srcWidth * scale));
      const targetHeight = Math.max(1, Math.round(srcHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context is unavailable.'));
        return;
      }

      // Fill white backdrop before JPEG encoding so transparent PNGs stay crisp
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({
        dataUrl: compressedDataUrl,
        mimeType: 'image/jpeg',
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to decode image for compression.'));
    };
    img.src = dataUrl;
  });
}

function unwrapJsonErrorString(input: string): { code?: number; message: string } {
  let current = input.trim();
  let code: number | undefined;

  for (let depth = 0; depth < 4; depth++) {
    const jsonStart = current.indexOf('{');
    if (jsonStart === -1) break;
    const jsonCandidate = current.slice(jsonStart);
    try {
      const parsed = JSON.parse(jsonCandidate) as {
        error?: string | { code?: number; status?: string; message?: string };
        message?: string;
        code?: number;
      };
      if (typeof parsed.code === 'number') code = parsed.code;
      if (typeof parsed.error === 'string') {
        current = parsed.error.trim();
        continue;
      }
      if (parsed.error && typeof parsed.error === 'object') {
        if (typeof parsed.error.code === 'number') code = parsed.error.code;
        if (typeof parsed.error.message === 'string') {
          current = parsed.error.message.trim();
          continue;
        }
      }
      if (typeof parsed.message === 'string') {
        current = parsed.message.trim();
        continue;
      }
      break;
    } catch {
      break;
    }
  }

  return { code, message: current };
}

function formatApiError(status: number, rawBody: string, fallback: string): string {
  const { code, message } = unwrapJsonErrorString(rawBody);
  const effectiveStatus = code ?? status;
  const lower = message.toLowerCase();

  if (lower.includes('gemini_api_key')) {
    return message;
  }

  if (
    effectiveStatus === 503 ||
    lower.includes('503') ||
    lower.includes('high demand') ||
    lower.includes('unavailable') ||
    lower.includes('overloaded')
  ) {
    return HIGH_DEMAND_MESSAGE;
  }

  if (effectiveStatus === 429 || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return 'Rate limit reached. Please wait a moment and try again.';
  }

  if (!message || message.startsWith('{') || message.startsWith('<')) {
    return fallback;
  }

  return message;
}

export function ExtractorWorkspace({
  mode,
  onModeChange,
  urlInputRef,
}: ExtractorWorkspaceProps) {
  const [urlValue, setUrlValue] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [loadedImage, setLoadedImage] = useState<LoadedImagePreview | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingLabel, setLoadingLabel] = useState<string>('');
  const [isImageRequestActive, setIsImageRequestActive] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [previewText, setPreviewText] = useState<string>(
    'The quick brown fox jumps over the lazy dog — 0123456789',
  );
  const [previewSize, setPreviewSize] = useState<number>(26);
  const [failedSampleThumbs, setFailedSampleThumbs] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeControllerRef = useRef<AbortController | null>(null);
  const abortReasonsRef = useRef(new WeakMap<AbortController, 'timeout' | 'cancelled'>());

  const abortActiveRequest = useCallback(() => {
    const current = activeControllerRef.current;
    if (current) {
      abortReasonsRef.current.set(current, 'cancelled');
      current.abort();
      activeControllerRef.current = null;
    }
    setIsImageRequestActive(false);
    setElapsedSeconds(0);
  }, []);

  useEffect(() => {
    return () => {
      abortActiveRequest();
    };
  }, [abortActiveRequest]);

  const runUrlExtraction = useCallback(async (targetUrl: string) => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setErrorMsg('Please enter a website URL to inspect (for example, https://tailwindcss.com).');
      return;
    }

    abortActiveRequest();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => {
      abortReasonsRef.current.set(controller, 'timeout');
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    setLoading(true);
    setLoadingLabel('Fetching HTML and linked stylesheets...');
    setErrorMsg(null);
    setResult(null);

    try {
      const response = await fetch('/api/extract-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
        signal: controller.signal,
      });

      const rawText = await response.text();
      if (controller.signal.aborted || activeControllerRef.current !== controller) {
        return;
      }

      if (!response.ok) {
        throw new Error(
          formatApiError(response.status, rawText, 'Could not extract fonts from this URL.'),
        );
      }

      const data = JSON.parse(rawText) as ExtractionResult;
      if (!data.fonts || data.fonts.length === 0) {
        throw new Error(
          'No explicit font declarations were found in accessible stylesheets for this page.',
        );
      }

      setResult(data);
    } catch (err) {
      const isAbort =
        (err instanceof DOMException && err.name === 'AbortError') ||
        (err instanceof Error && err.name === 'AbortError') ||
        controller.signal.aborted;

      if (isAbort) {
        if (
          abortReasonsRef.current.get(controller) === 'timeout' &&
          activeControllerRef.current === controller
        ) {
          setErrorMsg('The request timed out after 25 seconds. Please try again.');
        }
        return;
      }

      if (activeControllerRef.current === controller) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Unable to reach the target website.',
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (activeControllerRef.current === controller) {
        activeControllerRef.current = null;
        setLoading(false);
        setLoadingLabel('');
      }
    }
  }, [abortActiveRequest]);

  const runImageExtraction = useCallback(
    async (imagePayload: LoadedImagePreview) => {
      abortActiveRequest();
      const controller = new AbortController();
      activeControllerRef.current = controller;

      const startedAt = Date.now();
      const timeoutId = window.setTimeout(() => {
        abortReasonsRef.current.set(controller, 'timeout');
        controller.abort();
      }, IMAGE_REQUEST_TIMEOUT_MS);

      const intervalId = window.setInterval(() => {
        if (activeControllerRef.current === controller) {
          const seconds = Math.min(
            Math.round(IMAGE_REQUEST_TIMEOUT_MS / 1000),
            Math.floor((Date.now() - startedAt) / 1000),
          );
          setElapsedSeconds(seconds);
        }
      }, 1000);

      setLoading(true);
      setIsImageRequestActive(true);
      setElapsedSeconds(0);
      setLoadingLabel('Analyzing font geometry...');
      setErrorMsg(null);
      setResult(null);

      try {
        const compressed = await compressImageForUpload(
          imagePayload.dataUrl,
          MAX_UPLOAD_DIMENSION,
          JPEG_QUALITY,
        );

        if (controller.signal.aborted || activeControllerRef.current !== controller) {
          return;
        }

        const response = await fetch('/api/extract-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: compressed.dataUrl,
            mimeType: compressed.mimeType,
            fileName: imagePayload.fileName,
          }),
          signal: controller.signal,
        });

        const rawText = await response.text();
        if (controller.signal.aborted || activeControllerRef.current !== controller) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            formatApiError(
              response.status,
              rawText,
              'Could not identify fonts in this image.',
            ),
          );
        }

        const data = JSON.parse(rawText) as ExtractionResult;
        setResult(data);
      } catch (err) {
        const isAbort =
          (err instanceof DOMException && err.name === 'AbortError') ||
          (err instanceof Error && err.name === 'AbortError') ||
          controller.signal.aborted;

        if (isAbort) {
          if (
            abortReasonsRef.current.get(controller) === 'timeout' &&
            activeControllerRef.current === controller
          ) {
            setErrorMsg('The request timed out after 50 seconds. Please try again.');
          }
          return;
        }

        if (activeControllerRef.current === controller) {
          setErrorMsg(
            err instanceof Error
              ? formatApiError(500, err.message, 'Unable to analyze typography in this image.')
              : 'Unable to analyze typography in this image.',
          );
        }
      } finally {
        window.clearInterval(intervalId);
        window.clearTimeout(timeoutId);
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
          setLoading(false);
          setLoadingLabel('');
          setIsImageRequestActive(false);
          setElapsedSeconds(0);
        }
      }
    },
    [abortActiveRequest],
  );

  const processImageFile = useCallback(
    (file: File) => {
      abortActiveRequest();
      setLoading(false);
      setLoadingLabel('');
      setErrorMsg(null);
      setResult(null);

      const allowed = new Set(['image/png', 'image/jpeg', 'image/webp']);
      if (!allowed.has(file.type)) {
        setErrorMsg('Unsupported file format. Please upload a PNG, JPG, or WEBP image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMsg('Image exceeds 10MB limit. Please choose a smaller screenshot.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const payload: LoadedImagePreview = {
            dataUrl,
            fileName: file.name || 'pasted-screenshot.png',
            mimeType: file.type,
            dimensions: `${img.naturalWidth} × ${img.naturalHeight}px`,
          };
          setLoadedImage(payload);
          void runImageExtraction(payload);
        };
        img.onerror = () => {
          const payload: LoadedImagePreview = {
            dataUrl,
            fileName: file.name || 'uploaded-image.png',
            mimeType: file.type,
          };
          setLoadedImage(payload);
          void runImageExtraction(payload);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [abortActiveRequest, runImageExtraction],
  );

  const handleLoadSampleImage = async (presetId: string) => {
    const preset = SAMPLE_IMAGE_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;

    abortActiveRequest();
    setErrorMsg(null);
    setResult(null);
    setLoading(true);
    setLoadingLabel(`Loading ${preset.label} specimen...`);

    try {
      const response = await fetch(preset.imageUrl);
      if (!response.ok) {
        throw new Error('Could not load the sample image.');
      }
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      const file = new File([blob], preset.fileName, { type: mimeType });
      processImageFile(file);
    } catch (err) {
      setLoading(false);
      setLoadingLabel('');
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to load sample screenshot.',
      );
    }
  };

  // Clipboard paste support when Image Matcher tab is active
  useEffect(() => {
    if (mode !== 'image') return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [mode, processImageFile]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runUrlExtraction(urlValue);
  };

  const handleChooseAnotherImage = () => {
    abortActiveRequest();
    setLoading(false);
    setLoadingLabel('');
    setErrorMsg(null);
    setResult(null);
    setLoadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleReset = () => {
    abortActiveRequest();
    setLoading(false);
    setLoadingLabel('');
    setResult(null);
    setErrorMsg(null);
    if (mode === 'image') {
      setLoadedImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white border border-[#DCE0E8] rounded-2xl shadow-[0_8px_30px_rgba(17,19,24,0.04)] overflow-hidden">
      {/* Mode Switch Toolbar */}
      <div className="px-4 sm:px-6 pt-4 pb-3 border-b border-[#EBEEF4] bg-[#FAFBFD] flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Extraction method"
          className="inline-flex items-center gap-1 p-1 bg-[#EBEEF4] rounded-lg"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'url'}
            onClick={() => {
              onModeChange('url');
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] ${
              mode === 'url'
                ? 'bg-white text-[#111318] shadow-xs'
                : 'text-[#4E5666] hover:text-[#111318]'
            }`}
          >
            <Globe className="w-4 h-4 text-[#15803D]" />
            <span>From Website URL</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'image'}
            onClick={() => {
              onModeChange('image');
              setErrorMsg(null);
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] ${
              mode === 'image'
                ? 'bg-white text-[#111318] shadow-xs'
                : 'text-[#4E5666] hover:text-[#111318]'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-[#15803D]" />
            <span>From Image</span>
          </button>
        </div>

        <span className="text-xs text-[#5A6272] whitespace-nowrap">
          {mode === 'url'
            ? 'Reads @font-face, Google Fonts & CSS stacks'
            : 'Supports PNG, JPG, WEBP & clipboard paste'}
        </span>
      </div>

      {/* Workspace Body */}
      <div className="p-5 sm:p-7">
        {mode === 'url' ? (
          <div className="space-y-4">
            <form onSubmit={handleUrlSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <label htmlFor="url-extractor-input" className="sr-only">
                  Website URL
                </label>
                <Globe
                  aria-hidden="true"
                  className="w-4 h-4 text-[#737B8C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  ref={urlInputRef}
                  id="url-extractor-input"
                  type="text"
                  inputMode="url"
                  value={urlValue}
                  onChange={(e) => setUrlValue(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full h-12 pl-10 pr-4 text-sm sm:text-base font-mono bg-[#F8F9FB] border border-[#D4D8E2] rounded-lg text-[#111318] placeholder:text-[#8A92A3] focus:bg-white focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/15 focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-12 px-6 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] disabled:opacity-60 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Inspecting...</span>
                  </>
                ) : (
                  <span>Extract Fonts</span>
                )}
              </button>
            </form>

            {/* Sample URL Quick-Fill Chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#5A6272] font-medium">Try sample URL:</span>
              {SAMPLE_URL_PRESETS.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setUrlValue(preset.url);
                    void runUrlExtraction(preset.url);
                  }}
                  className="px-2.5 py-1.5 font-mono text-xs bg-[#F4F5F8] hover:bg-[#E9ECF4] text-[#2A303D] border border-[#E2E5EB] rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processImageFile(file);
              }}
              className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-colors ${
                isDragging
                  ? 'border-[#15803D] bg-green-50/40'
                  : 'border-[#CFD5E0] bg-[#FAFBFD] hover:border-[#9AA3B5]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) processImageFile(file);
                }}
              />

              {loadedImage ? (
                <div className="flex flex-col sm:flex-row items-center gap-5 text-left">
                  <div className="w-full sm:w-44 h-32 rounded-lg border border-[#DCE0E8] bg-white overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={loadedImage.dataUrl}
                      alt={`Uploaded specimen: ${loadedImage.fileName}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111318] truncate">
                      {loadedImage.fileName}
                    </p>
                    <p className="mt-1 text-xs font-mono text-[#5A6272]">
                      {loadedImage.mimeType}
                      {loadedImage.dimensions ? ` · ${loadedImage.dimensions}` : ''}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => void runImageExtraction(loadedImage)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Re-run Font Match
                      </button>
                      <button
                        type="button"
                        onClick={handleChooseAnotherImage}
                        className="px-4 py-2 text-xs font-medium text-[#111318] bg-white border border-[#D4D8E2] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Choose Another Image
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-11 h-11 rounded-lg bg-white border border-[#DCE0E8] flex items-center justify-center text-[#15803D] mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-[#111318]">
                    Drop an image here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#15803D] font-semibold hover:underline underline-offset-4 cursor-pointer"
                    >
                      browse files
                    </button>
                  </p>
                  <p className="mt-1.5 text-xs text-[#5A6272] flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
                    <span>PNG, JPG, or WEBP up to 10MB</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-medium text-[#111318]">
                      <ClipboardPaste className="w-3.5 h-3.5 text-[#15803D]" />
                      Paste from clipboard (Ctrl/⌘ + V)
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Sample Screenshot Options */}
            <div>
              <p className="text-xs font-medium text-[#5A6272] mb-2.5">
                Or test instantly with a sample screenshot:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_IMAGE_PRESETS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    disabled={loading}
                    onClick={() => void handleLoadSampleImage(sample.id)}
                    className="group flex items-center gap-3 p-2.5 text-left bg-[#F8F9FB] hover:bg-white border border-[#E2E5EB] hover:border-[#15803D] rounded-lg transition-all cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
                  >
                    <div className="w-14 h-11 rounded-md border border-[#E2E5EB] bg-white overflow-hidden shrink-0 flex items-center justify-center">
                      {failedSampleThumbs[sample.id] ? (
                        <Type className="w-4 h-4 text-[#15803D]" />
                      ) : (
                        <img
                          src={sample.imageUrl}
                          alt={sample.label}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedSampleThumbs((prev) => ({ ...prev, [sample.id]: true }))
                          }
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#111318] group-hover:text-[#15803D] truncate">
                        {sample.label}
                      </div>
                      <div className="text-[11px] text-[#5A6272] truncate">
                        {sample.subtitle}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && isImageRequestActive && !result && !errorMsg && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 p-4 rounded-xl bg-[#FAFBFD] border border-[#DCE0E8] space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2.5 text-[#111318] font-medium">
                <Loader2 className="w-4 h-4 text-[#15803D] animate-spin shrink-0" />
                <span>Analyzing font geometry...</span>
              </div>
              <span className="font-mono text-xs text-[#4E5666] tabular-nums">
                {elapsedSeconds}s / 50s max (up to ~50s)
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#E6E9F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#15803D] rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(4, (elapsedSeconds / 50) * 100))}%`,
                }}
              />
            </div>
          </div>
        )}

        {loading && !isImageRequestActive && (
          <div
            role="status"
            aria-live="polite"
            className="mt-6 pt-6 border-t border-[#EBEEF4] flex items-center gap-3 text-sm text-[#4E5666]"
          >
            <Loader2 className="w-4 h-4 text-[#15803D] animate-spin shrink-0" />
            <span>{loadingLabel}</span>
          </div>
        )}

        {/* Error State */}
        {errorMsg && !loading && (
          <div
            role="alert"
            className="mt-6 p-4 rounded-xl bg-red-50/70 border border-red-200 flex items-start gap-3 text-sm text-red-900"
          >
            <AlertCircle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Live Extracted Results */}
        {result && !loading && (
          <div className="mt-7 pt-6 border-t border-[#E2E5EB] space-y-5">
            {/* Summary & Specimen Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#5A6272]">
                  <span className="font-semibold text-[#111318]">
                    {result.fonts.length}{' '}
                    {result.fonts.length === 1 ? 'font detected' : 'fonts detected'}
                  </span>
                  <span aria-hidden="true">·</span>
                  {result.mode === 'url' ? (
                    <>
                      <span className="truncate max-w-xs">{result.resolvedUrl}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {result.scannedStylesheets}{' '}
                        {result.scannedStylesheets === 1 ? 'stylesheet' : 'stylesheets'}
                      </span>
                    </>
                  ) : (
                    <span className="truncate max-w-xs">{result.fileName}</span>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{result.elapsedMs}ms</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4E5666] hover:text-[#111318] cursor-pointer whitespace-nowrap self-start lg:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear results</span>
              </button>
            </div>

            {/* Live Custom Preview Text Toolbar */}
            <div className="p-3.5 bg-[#F6F7FA] border border-[#E2E5EB] rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label htmlFor="live-workspace-preview" className="sr-only">
                  Custom preview text
                </label>
                <input
                  id="live-workspace-preview"
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  placeholder="Type custom specimen text to preview across all detected fonts..."
                  className="w-full h-9 px-3 text-sm bg-white border border-[#D4D8E2] rounded-md text-[#111318] focus:border-[#15803D] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label
                  htmlFor="live-workspace-size"
                  className="text-xs font-mono text-[#4E5666] whitespace-nowrap tabular-nums"
                >
                  {previewSize}px
                </label>
                <input
                  id="live-workspace-size"
                  type="range"
                  min={16}
                  max={44}
                  value={previewSize}
                  onChange={(e) => setPreviewSize(Number(e.target.value))}
                  className="w-28 accent-[#15803D] cursor-pointer"
                />
              </div>
            </div>

            {/* Result Cards */}
            <div className="space-y-4">
              {result.fonts.map((font) => (
                <FontResultCard
                  key={font.id}
                  font={font}
                  previewText={previewText}
                  previewSize={previewSize}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
