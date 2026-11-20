# FontExtractor

**Extract fonts from any website URL or uploaded image in seconds — 100% free with zero login required.**

FontExtractor (`fontextractor.com`) is a lightweight typography inspection tool built for UI/UX designers, frontend developers, and brand teams. Paste a live URL to inspect CSS stylesheets and `@font-face` rules, or drop/paste a screenshot to identify matching typefaces and copy production-ready CSS.

---

## Features

- **Website URL Extraction (`POST /api/extract-url`)**
  - Fetches public HTML pages and linked CSS stylesheets in real time.
  - Parses Google Fonts `<link>` and `@import` rules, Adobe Fonts (Typekit), `@font-face` declarations, CSS `--font-*` variables, and selector-level `font-family` stacks.
  - Includes one-click sample URL presets (`stripe.com`, `vercel.com`, `tailwindcss.com`, `en.wikipedia.org`).
  - Blocks private and local network ranges to prevent SSRF.
- **Image & Screenshot Matching (`POST /api/extract-image`)**
  - Supports drag-and-drop, file browsing (`PNG`, `JPG`, `WEBP` up to 10MB), and direct clipboard paste (`Ctrl/Cmd + V`).
  - Includes built-in sample specimens (*Editorial Poster*, *SaaS Metrics UI*, *Packaging Label*) for instant testing.
  - Returns closest matching typefaces, confidence scores, typographic classification, and structural letterform notes.
- **Live Specimen Preview & One-Click CSS**
  - Custom preview text input and adjustable font-size slider (`16px`–`44px`).
  - Interactive font-weight and italic toggles that dynamically update both the live preview and CSS output.
  - Dynamically loads matching Google Fonts so previews render in the detected typeface.
  - Copyable CSS snippets (`font-family`, `font-weight`, `font-style`, and optional `@import`) plus direct Google Fonts and foundry lookup links.
- **Zero Friction & License-Respectful**
  - No accounts, login walls, watermarks, or daily caps.
  - Inspects public CSS metadata and matches visual letterforms without extracting or redistributing font binary files.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express, `tsx` (`server.ts` serving API routes and Vite middleware)
- **Typography Matching (Image Mode):** `@google/genai` (`gemini-4-hydrogen`, server-side only)

---

## Getting Started

### Prerequisites

- Node.js 20+ (or 22+)
- npm (or compatible package manager)

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and add your credentials:

```bash
cp .env.example .env
```

```env
# Required for Image Matcher (/api/extract-image)
GEMINI_API_KEY="your_gemini_api_key"

# Optional public app URL
APP_URL="http://localhost:3000"
```

> **Note:** Website URL font extraction (`/api/extract-url`) works out of the box without an API key. `GEMINI_API_KEY` is only required for image/screenshot font recognition (`/api/extract-image`).

### 3. Run in Development

```bash
npm run dev
```

The Express + Vite development server starts on `http://localhost:3000`.

### 4. Build & Run in Production

```bash
npm run build
npm start
```

### 5. Type Check

```bash
npm run lint
```

---

## API Endpoints

### `POST /api/extract-url`

Inspects a public webpage or CSS stylesheet and returns detected fonts.

**Request Body:**

```json
{
  "url": "https://stripe.com"
}
```

**Response (`200 OK`):**

```json
{
  "mode": "url",
  "resolvedUrl": "https://stripe.com/",
  "pageTitle": "Stripe | Financial Infrastructure to Grow Your Revenue",
  "scannedStylesheets": 3,
  "elapsedMs": 240,
  "fonts": [
    {
      "id": "url-font-0-sohne-var",
      "family": "sohne-var",
      "role": "Web Font",
      "source": "CSS @font-face",
      "weights": ["400", "500", "600", "700"],
      "styles": ["normal"],
      "fallbackStack": "sans-serif",
      "cssSnippet": "font-family: 'sohne-var', sans-serif;\nfont-weight: 600;\nfont-style: normal;",
      "googleFontsUrl": "https://fonts.google.com/?query=sohne-var",
      "foundryLookupUrl": "https://www.myfonts.com/search?query=sohne-var"
    }
  ]
}
```

### `POST /api/extract-image`

Analyzes visible typography inside an uploaded PNG, JPG, or WEBP image.

**Request Body:**

```json
{
  "imageBase64": "data:image/png;base64,...",
  "mimeType": "image/png",
  "fileName": "screenshot.png"
}
```

**Response (`200 OK`):** Returns matched typeface families, confidence percentages, classifications, observed text samples, letterform notes, and CSS rules.

---

## Project Structure

```text
├── server.ts                         # Express server, API routes, and Vite middleware
├── server/
│   └── fontParser.ts                 # HTML/CSS parser for URL font extraction
├── src/
│   ├── App.tsx                       # Main page layout & mode state
│   ├── index.css                     # Tailwind CSS v4 setup & typography tokens
│   ├── components/
│   │   ├── Navbar.tsx                # Top navigation bar & mobile drawer
│   │   ├── ExtractorWorkspace.tsx    # URL & Image extraction workspace
│   │   ├── FontResultCard.tsx        # Specimen preview, weight controls & CSS copy
│   │   ├── SampleResultsSection.tsx  # Interactive sample output section
│   │   ├── HowItWorksSection.tsx     # 3-step workflow overview
│   │   ├── FeaturesSection.tsx       # Capabilities grid
│   │   ├── FaqSection.tsx            # Accessible FAQ accordion
│   │   └── Footer.tsx                # Footer & Privacy/Terms dialogs
│   ├── data/
│   │   └── samples.ts                # Sample URLs, specimen images, preview data & FAQs
│   ├── types/
│   │   └── font.ts                   # Shared TypeScript interfaces
│   └── utils/
│       └── fontLoader.ts             # Dynamic Google Fonts loader for live previews
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```

---

## Privacy & Licensing

- Uploaded images and submitted URLs are processed strictly in memory for real-time typography inspection and are not archived or published.
- FontExtractor does not extract, host, or redistribute `.woff2`, `.ttf`, or `.otf` font files. Users are responsible for reviewing typeface licensing terms via Google Fonts or the owning type foundry.
