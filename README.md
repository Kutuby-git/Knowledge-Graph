# Quranic Arabic Knowledge Graph

An interactive knowledge graph visualization for **768 Quranic Arabic words** across **15 thematic units**. Designed as a modular visualization feature for integration into Arabic language teaching applications for kids.

## What This Is

A rich Excel dataset of Quranic Arabic vocabulary transformed into an intelligent, explorable knowledge graph. Words are connected through shared themes, Arabic roots, opposite pairs, virtue pairs, and semantic similarity — making vocabulary learning visual and intuitive.

```
768 unique words · 15 themes · 988 connections · ~130 sub-themes
```

### The 15 Thematic Units

| Unit | Theme | Unit | Theme |
|------|-------|------|-------|
| A | Animals in the Quran | I | Body & Senses |
| B | Fruits, Plants, Creation | J | Opposites & Big Concepts |
| C | People & Family | K | Prophets & People |
| D | Places & Nature | L | Virtue Pairs |
| E | Names of Allah | M | Spiritual Heart Actions |
| F | Salah & Worship | N | Emotions in the Quran |
| G | Time, Numbers, Days | O | Colors & Descriptors |
| H | Character & Ethics | | |

## Architecture

```
┌──────────────────────────────────────────┐
│        Next.js 15 Web App                │
│  ┌────────────┐  ┌────────────────────┐  │
│  │ Force Graph │  │ Word Explorer      │  │
│  │ (3 zoom    │  │ Search, Filter,    │  │
│  │  levels)   │  │ Recommendations    │  │
│  └────────────┘  └────────────────────┘  │
└──────────────┬───────────────────────────┘
               │
┌──────────────┴───────────────────────────┐
│     Supabase (PostgreSQL + pgvector)     │
│  words | themes | roots | relationships  │
│  embeddings (384d) | DB functions        │
└──────────────────────────────────────────┘
               ▲
┌──────────────┴───────────────────────────┐
│     Python Data Pipeline (one-time)      │
│  Excel parsing → Enrichment → Import     │
└──────────────────────────────────────────┘
```

## Key Features

### Interactive Graph Visualization
Three-level hierarchical exploration using force-directed graphs:
1. **Unit Overview** — 15 colorful theme nodes
2. **Sub-Theme View** — Drill into any unit to see sub-themes and words
3. **Word Focus** — Select a word to see all its connections (root siblings, opposites, semantic neighbors)

Arabic text renders directly on Canvas nodes using the Amiri font.

### Smart Data Pipeline
The Python ingestion pipeline handles real-world data messiness:
- 3 different Excel sheet formats (6-col, 15-col dual, 18-col dual)
- Excel corrupts `Surah:Ayah` references into 4 different Python types — all fixed
- 4 shifted rows in Unit K — detected and corrected
- Advanced sheet with unit-coded theme orders (e.g., `"A8"`, `"B6"`)
- Deduplication by bare Arabic text, preserving all theme associations

### AI-Powered Enrichment
- **Root extraction** via Claude API with CAMeL Tools cross-validation
- **Difficulty scoring** (1-5) computed from character count, shaddah, hamza, multi-word phrases, advanced origin
- **Semantic embeddings** (384d) via `multilingual-e5-small` for similarity search

### Recommendation Engine
Multi-signal word recommendations:
| Signal | Weight |
|--------|--------|
| Same root | 0.9 |
| Explicit pair (opposite/virtue) | 0.8 |
| Same theme | 0.7 |
| Semantic similarity | 0.6 |
| Similar difficulty | 0.5 |

### Kid-Friendly Chat Assistant
Structured retrieval + Claude API for answering vocabulary questions in age-appropriate language.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS 4 |
| Graph | react-force-graph-2d (Canvas rendering) |
| Arabic Font | Amiri (Google Fonts) |
| Animation | Framer Motion |
| Database | Supabase PostgreSQL + pgvector |
| Data Pipeline | Python 3 + openpyxl |
| Embeddings | intfloat/multilingual-e5-small (384d) |
| LLM | Claude API |

## Project Structure

```
├── scripts/                  # Python data pipeline (one-time)
│   ├── ingest.py             # Excel → Supabase (handles all 3 formats)
│   ├── enrich.py             # Root extraction + difficulty scoring
│   ├── embeddings.py         # Generate 384d vectors
│   ├── relationships.py      # Compute semantic similarity edges
│   └── validate_roots.py     # CAMeL Tools cross-validation
├── src/
│   ├── app/                  # Next.js pages
│   │   ├── page.tsx          # Landing (15-unit grid)
│   │   ├── explore/          # Force-graph visualization
│   │   ├── unit/[id]/        # Unit detail (sub-themes + words)
│   │   ├── word/[id]/        # Word detail + connection graph
│   │   ├── search/           # Search by Arabic/English/transliteration
│   │   ├── learn/            # Difficulty-ordered learning paths
│   │   ├── admin/review/     # Enrichment review UI
│   │   └── api/              # Recommendations + chat endpoints
│   ├── components/
│   │   ├── graph/            # KnowledgeGraph, GraphControls
│   │   ├── word/             # WordCard, WordBadge
│   │   ├── unit/             # UnitGrid
│   │   ├── chat/             # ChatPanel (floating assistant)
│   │   └── ui/               # ArabicText component
│   └── lib/
│       ├── supabase/         # Client setup
│       └── graph/            # Transform, colors, utilities
├── supabase/migrations/      # Database schema + seed data
└── package.json
```

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Supabase project (free tier works)

### 1. Install dependencies

```bash
npm install
pip install -r scripts/requirements.txt
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and service role key
# Optionally add ANTHROPIC_API_KEY for enrichment + chat
```

### 3. Set up database

Run the contents of `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor. This creates all tables, indexes, functions, and seeds the 15 units.

### 4. Ingest data

```bash
python scripts/ingest.py
```

This parses the Excel file and populates: 768 words, ~130 sub-themes, 988 word-theme associations, and initial relationship edges.

### 5. Run the app

```bash
npm run dev
```

### Optional: Enrichment pipeline

```bash
# Extract roots via Claude API + compute difficulty scores
python scripts/enrich.py

# Generate semantic embeddings
python scripts/embeddings.py

# Compute similarity-based relationships
python scripts/relationships.py
```

## Integration Notes

This is designed as a **modular visualization feature** for integration into a larger teaching application. The key integration points are:

- **`KnowledgeGraph.tsx`** — Drop-in force-graph component, accepts graph data and callbacks
- **`WordCard.tsx`** / **`WordBadge.tsx`** — Reusable word display components
- **`UnitGrid.tsx`** — Landing page grid, works with any unit data
- **`/api/recommendations`** — REST endpoint for word recommendations
- **`/api/chat`** — REST endpoint for AI-assisted vocabulary questions
- **`src/lib/graph/transform.ts`** — Database-to-graph data transformers

All components use Tailwind CSS and are designed to be theme-customizable.

## License

This project contains Quranic Arabic educational content. The codebase is open source.
