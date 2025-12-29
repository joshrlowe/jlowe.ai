# ML Portfolio Optimization: Complete Implementation Plan

## Overview

This document outlines the complete implementation strategy to transform jlowe.ai from a general AI consultant portfolio into a standout ML internship recruitment platform for Summer 2026.

**Current State:** Next.js 15 portfolio with Three.js animations, Prisma/PostgreSQL backend, admin CMS
**Target State:** Interactive ML showcase with live inference, RAG chatbot, research demonstrations, and recruiter-optimized UX

---

## Phase 1: Foundation & Infrastructure

### 1.1 Database Schema Extensions

**New Models Required:**

```prisma
// ML-specific project metadata
model MLProject {
  id                String   @id @default(cuid())
  projectId         String   @unique
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)

  // ML-specific fields
  problemType       MLProblemType        // Classification, Regression, NLP, CV, RL, etc.
  datasetInfo       Json?                // { name, size, source, license }
  modelArchitecture String?              // e.g., "Transformer", "CNN", "GNN"
  framework         String?              // PyTorch, TensorFlow, JAX
  metrics           Json?                // { accuracy: 0.95, f1: 0.92, etc. }
  trainingConfig    Json?                // { epochs, batchSize, optimizer, lr }

  // Interactive demo
  hasLiveDemo       Boolean  @default(false)
  demoType          DemoType?            // Gradio, HuggingFace, Custom
  demoUrl           String?
  inferenceEndpoint String?

  // Research connection
  paperUrl          String?
  paperTitle        String?
  isReproduction    Boolean  @default(false)

  // Model artifacts
  modelCardUrl      String?
  weightsUrl        String?
  notebookUrl       String?

  // Visualizations stored as JSON
  trainingCurves    Json?    // { epochs: [], trainLoss: [], valLoss: [] }
  confusionMatrix   Json?
  featureImportance Json?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("ml_projects")
}

enum MLProblemType {
  Classification
  Regression
  Clustering
  NLP
  ComputerVision
  ReinforcementLearning
  Generative
  Recommendation
  TimeSeries
  GraphML
  MultiModal
  Other
}

enum DemoType {
  Gradio
  HuggingFaceSpace
  StreamlitCloud
  CustomAPI
  BrowserInference
}

// RAG Knowledge Base for portfolio chatbot
model KnowledgeChunk {
  id          String   @id @default(cuid())
  content     String   // Text content
  embedding   Json     // Vector embedding (stored as array)
  sourceType  String   // "project", "post", "resume", "about"
  sourceId    String?  // Reference to source document
  metadata    Json?    // Additional context
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([sourceType])
  @@map("knowledge_chunks")
}

// Chat sessions for portfolio chatbot
model ChatSession {
  id        String        @id @default(cuid())
  messages  ChatMessage[]
  metadata  Json?         // { userAgent, referrer, etc. }
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  @@map("chat_sessions")
}

model ChatMessage {
  id        String      @id @default(cuid())
  sessionId String
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role      String      // "user" | "assistant"
  content   String
  sources   Json?       // Referenced chunks
  createdAt DateTime    @default(now())

  @@index([sessionId])
  @@map("chat_messages")
}

// Analytics for recruiter behavior
model AnalyticsEvent {
  id         String   @id @default(cuid())
  eventType  String   // "page_view", "demo_interaction", "resume_download", etc.
  page       String?
  projectId  String?
  metadata   Json?
  userAgent  String?
  referrer   String?
  ipHash     String?  // Hashed for privacy
  createdAt  DateTime @default(now())

  @@index([eventType])
  @@index([createdAt])
  @@map("analytics_events")
}

// Research/Paper implementations
model ResearchPaper {
  id              String   @id @default(cuid())
  title           String
  slug            String   @unique
  authors         String[]
  venue           String?  // Conference/journal
  year            Int
  arxivUrl        String?
  pdfUrl          String?

  // Implementation details
  myImplementation     String?  // Markdown description
  implementationUrl    String?  // GitHub link
  keyInsights          String?  // What I learned
  difficultyRating     Int?     // 1-5
  reproductionAccuracy Float?   // How close to original results

  // Related project
  projectId       String?

  // Display
  coverImage      String?
  tags            String[]
  featured        Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([year])
  @@index([featured])
  @@map("research_papers")
}

// Kaggle/Competition tracking
model Competition {
  id              String   @id @default(cuid())
  platform        String   // "Kaggle", "DrivenData", etc.
  name            String
  slug            String   @unique
  url             String

  // Performance
  rank            Int?
  totalTeams      Int?
  percentile      Float?
  medal           String?  // "gold", "silver", "bronze"

  // Solution
  solutionSummary String?  // Markdown
  approach        String?
  keyTechniques   String[]
  repositoryUrl   String?

  // Dates
  startDate       DateTime?
  endDate         DateTime?

  // Display
  featured        Boolean  @default(false)

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([platform])
  @@index([featured])
  @@map("competitions")
}
```

### 1.2 New Dependencies

Add to `package.json`:

```json
{
  "dependencies": {
    // Vector/Embeddings
    "@xenova/transformers": "^2.17.0",        // Client-side transformers
    "openai": "^4.28.0",                       // For embeddings API

    // Visualization
    "recharts": "^2.12.0",                     // Charts for ML metrics
    "react-plotly.js": "^2.6.0",              // Interactive plots
    "plotly.js": "^2.29.0",
    "mermaid": "^10.8.0",                      // Architecture diagrams

    // Math/ML Display
    "katex": "^0.16.9",                        // LaTeX rendering
    "react-katex": "^3.0.1",

    // ML Inference (browser)
    "@huggingface/inference": "^2.6.4",       // HF Inference API
    "onnxruntime-web": "^1.17.0",             // ONNX in browser

    // Chat UI
    "ai": "^3.0.0",                            // Vercel AI SDK for streaming

    // Additional Utils
    "uuid": "^9.0.0",
    "date-fns": "^3.3.0"
  },
  "devDependencies": {
    "@types/katex": "^0.16.7"
  }
}
```

### 1.3 Environment Variables

Add to `.env`:

```env
# OpenAI for embeddings and chat
OPENAI_API_KEY=sk-...

# Hugging Face for model inference
HUGGINGFACE_API_KEY=hf_...

# Optional: Pinecone for production vector search
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
PINECONE_INDEX=...

# Analytics
PLAUSIBLE_DOMAIN=jlowe.ai
# OR
POSTHOG_API_KEY=...
```

---

## Phase 2: ML Project Showcase Enhancement

### 2.1 Project Category System

**File:** `lib/utils/projectCategories.js`

```javascript
export const PROJECT_CATEGORIES = {
  'ml-flagship': {
    label: 'ML Flagship Projects',
    description: 'Interactive demonstrations with live inference',
    priority: 1,
    showOnHome: true,
    maxDisplay: 4
  },
  'ml-research': {
    label: 'Research & Papers',
    description: 'Paper implementations and reproductions',
    priority: 2,
    showOnHome: false
  },
  'ml-experiments': {
    label: 'Experiments & Notebooks',
    description: 'Exploratory work and learning projects',
    priority: 3,
    showOnHome: false
  },
  'engineering': {
    label: 'Engineering & Infrastructure',
    description: 'Systems, APIs, and full-stack applications',
    priority: 4,
    showOnHome: false
  },
  'archive': {
    label: 'Archive',
    description: 'Older or completed projects',
    priority: 5,
    showOnHome: false
  }
};
```

### 2.2 Enhanced Project Page Structure

**New Pages:**

```
pages/
├── projects/
│   ├── index.jsx              # Enhanced with category tabs
│   ├── [slug].jsx             # Enhanced project detail
│   └── [slug]/
│       └── demo.jsx           # Full-screen demo page
├── lab/
│   ├── index.jsx              # ML Lab landing page
│   ├── playground.jsx         # Multi-model playground
│   └── [model-slug].jsx       # Individual model demo
├── research/
│   ├── index.jsx              # Paper implementations list
│   └── [slug].jsx             # Individual paper page
└── competitions/
    ├── index.jsx              # Competition history
    └── [slug].jsx             # Competition detail
```

### 2.3 ML Visualization Components

**Directory:** `components/MLViz/`

| Component | Purpose |
|-----------|---------|
| `TrainingCurves.jsx` | Interactive loss/accuracy charts with zoom |
| `ConfusionMatrix.jsx` | Heatmap confusion matrix with tooltips |
| `FeatureImportance.jsx` | Bar chart of feature weights |
| `ModelArchitecture.jsx` | Mermaid-based architecture diagrams |
| `MetricsCard.jsx` | Display model performance metrics |
| `DatasetExplorer.jsx` | Sample data visualization |
| `PredictionViz.jsx` | Show model predictions on samples |
| `AttentionHeatmap.jsx` | For transformer attention visualization |
| `EmbeddingProjection.jsx` | t-SNE/UMAP projections (using Plotly) |
| `ROCCurve.jsx` | ROC and Precision-Recall curves |

**Example Implementation - TrainingCurves.jsx:**

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

export default function TrainingCurves({ data, title = "Training Progress" }) {
  const [showValidation, setShowValidation] = useState(true);

  // Transform data: { epochs: [], trainLoss: [], valLoss: [], trainAcc: [], valAcc: [] }
  const chartData = data.epochs.map((epoch, i) => ({
    epoch,
    trainLoss: data.trainLoss[i],
    valLoss: data.valLoss?.[i],
    trainAcc: data.trainAcc?.[i],
    valAcc: data.valAcc?.[i]
  }));

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showValidation}
            onChange={(e) => setShowValidation(e.target.checked)}
            className="rounded"
          />
          Show Validation
        </label>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="epoch"
            stroke="var(--color-text-muted)"
            label={{ value: 'Epoch', position: 'bottom' }}
          />
          <YAxis stroke="var(--color-text-muted)" />
          <Tooltip
            contentStyle={{
              background: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="trainLoss"
            stroke="var(--color-primary)"
            name="Train Loss"
            dot={false}
          />
          {showValidation && (
            <Line
              type="monotone"
              dataKey="valLoss"
              stroke="var(--color-accent)"
              name="Val Loss"
              dot={false}
              strokeDasharray="5 5"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 2.4 Skills → Evidence Linking

**Modification:** `components/About/TechnicalSkills/TechnicalSkills.jsx`

Add hover cards that show related projects for each skill:

```jsx
// Enhanced skill item with project links
function SkillWithEvidence({ skill, relatedProjects }) {
  const [showProjects, setShowProjects] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowProjects(true)}
      onMouseLeave={() => setShowProjects(false)}
    >
      <SkillBadge skill={skill} />

      {showProjects && relatedProjects.length > 0 && (
        <div className="absolute z-50 top-full left-0 mt-2 w-72 card p-4 shadow-xl">
          <p className="text-xs text-[var(--color-text-muted)] mb-2">
            Demonstrated in:
          </p>
          {relatedProjects.slice(0, 3).map(project => (
            <Link
              key={project.id}
              href={`/projects/${project.slug}`}
              className="block text-sm hover:text-[var(--color-primary)] py-1"
            >
              → {project.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Phase 3: RAG-Powered Portfolio Chatbot

### 3.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Portfolio Chatbot                        │
├─────────────────────────────────────────────────────────────┤
│  User Query                                                 │
│      ↓                                                      │
│  Embed Query (OpenAI text-embedding-3-small)               │
│      ↓                                                      │
│  Vector Search (PostgreSQL pgvector OR in-memory)          │
│      ↓                                                      │
│  Retrieve Top-K Relevant Chunks                            │
│      ↓                                                      │
│  Construct Prompt with Context                             │
│      ↓                                                      │
│  Generate Response (OpenAI GPT-4 / Claude)                 │
│      ↓                                                      │
│  Stream Response to Client                                  │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Knowledge Ingestion Pipeline

**File:** `lib/rag/ingest.js`

```javascript
import { openai } from './openai';
import prisma from '../prisma';

const CHUNK_SIZE = 500;  // tokens
const CHUNK_OVERLAP = 50;

export async function ingestProject(project) {
  const chunks = [];

  // Chunk the project description
  const descriptionChunks = splitIntoChunks(project.longDescription, CHUNK_SIZE, CHUNK_OVERLAP);

  for (const chunk of descriptionChunks) {
    chunks.push({
      content: chunk,
      sourceType: 'project',
      sourceId: project.id,
      metadata: {
        title: project.title,
        slug: project.slug,
        techStack: project.techStack
      }
    });
  }

  // Generate embeddings
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.content);
    await prisma.knowledgeChunk.create({
      data: {
        ...chunk,
        embedding
      }
    });
  }
}

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}

function splitIntoChunks(text, size, overlap) {
  // Implementation of text chunking
  // Split by sentences, then group into chunks
}
```

### 3.3 Vector Search Implementation

**Option A: PostgreSQL with pgvector (Recommended for Vercel)**

```sql
-- Add pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column
ALTER TABLE knowledge_chunks
ADD COLUMN embedding_vector vector(1536);

-- Create index for fast similarity search
CREATE INDEX ON knowledge_chunks
USING ivfflat (embedding_vector vector_cosine_ops)
WITH (lists = 100);
```

**Option B: In-Memory for Development**

```javascript
// lib/rag/vectorStore.js
import { cosineSimilarity } from './utils';

let vectorStore = [];

export async function loadVectorStore() {
  const chunks = await prisma.knowledgeChunk.findMany();
  vectorStore = chunks.map(c => ({
    ...c,
    embedding: JSON.parse(c.embedding)
  }));
}

export function search(queryEmbedding, topK = 5) {
  const scored = vectorStore.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
```

### 3.4 Chat API Endpoint

**File:** `pages/api/chat/index.js`

```javascript
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { openai } from '@/lib/rag/openai';
import { searchKnowledge } from '@/lib/rag/search';
import prisma from '@/lib/prisma';

export const runtime = 'edge';  // Use edge runtime for streaming

const SYSTEM_PROMPT = `You are Josh Lowe's portfolio assistant. You help recruiters, hiring managers, and visitors learn about Josh's experience, projects, and skills.

You have access to detailed information about Josh's:
- Machine learning projects and implementations
- Technical skills and experience
- Educational background
- Research interests

Be helpful, concise, and professional. When referencing specific projects or experiences, provide accurate details from the context provided.

If asked something not covered in the context, acknowledge the limitation and suggest what you can help with instead.`;

export async function POST(req) {
  const { messages, sessionId } = await req.json();

  const lastMessage = messages[messages.length - 1];

  // Search for relevant context
  const relevantChunks = await searchKnowledge(lastMessage.content, 5);

  // Build context string
  const context = relevantChunks
    .map(chunk => `[${chunk.sourceType}: ${chunk.metadata?.title || 'Unknown'}]\n${chunk.content}`)
    .join('\n\n---\n\n');

  // Build messages with context
  const systemMessage = {
    role: 'system',
    content: `${SYSTEM_PROMPT}\n\n## Relevant Context:\n${context}`
  };

  // Generate response
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    stream: true,
    messages: [systemMessage, ...messages],
    temperature: 0.7,
    max_tokens: 1000
  });

  // Log the interaction
  if (sessionId) {
    await prisma.chatMessage.createMany({
      data: [
        { sessionId, role: 'user', content: lastMessage.content },
        // Assistant message logged after streaming completes
      ]
    });
  }

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}
```

### 3.5 Chat UI Component

**File:** `components/Chat/PortfolioChat.jsx`

```jsx
import { useState, useRef, useEffect } from 'react';
import { useChat } from 'ai/react';

export default function PortfolioChat() {
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi! I'm Josh's portfolio assistant. Ask me about his ML projects, experience, or skills."
      }
    ]
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[var(--color-primary)] text-white shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
        aria-label="Open chat"
      >
        {isOpen ? (
          <XIcon className="w-6 h-6" />
        ) : (
          <ChatIcon className="w-6 h-6" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] card flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="font-semibold">Ask My Portfolio</h3>
            <p className="text-xs text-[var(--color-text-muted)]">
              Powered by RAG + GPT-4
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[var(--color-bg-surface)] p-3 rounded-lg">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--color-border)]">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about Josh's experience..."
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
```

### 3.6 Knowledge Sources to Ingest

| Source | Content | Priority |
|--------|---------|----------|
| Projects | Long descriptions, tech stacks, outcomes | High |
| Posts/Articles | Full content | High |
| About | Professional summary, experience, education | High |
| Resume PDF | Parsed text | High |
| GitHub READMEs | Project documentation | Medium |
| Research Papers | Implementation notes | Medium |

---

## Phase 4: Live Model Inference

### 4.1 Inference Architecture Options

| Approach | Pros | Cons | Use Case |
|----------|------|------|----------|
| Hugging Face Spaces | Free hosting, easy setup | Cold starts, limited compute | Quick demos |
| HF Inference API | Simple API calls | Rate limits, cost | Low-traffic demos |
| ONNX in Browser | No backend needed | Model size limits | Small models |
| Custom FastAPI | Full control | Need to host | Production models |
| Replicate | Pay-per-use, many models | Cost at scale | Occasional use |

### 4.2 Hugging Face Spaces Integration

**File:** `lib/inference/huggingface.js`

```javascript
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function classifyText(text, model = 'your-username/your-model') {
  const result = await hf.textClassification({
    model,
    inputs: text
  });
  return result;
}

export async function generateImage(prompt, model = 'stabilityai/stable-diffusion-2') {
  const result = await hf.textToImage({
    model,
    inputs: prompt
  });
  return result;  // Returns a Blob
}

export async function embedText(text) {
  const result = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: text
  });
  return result;
}
```

### 4.3 Browser-Based Inference (ONNX)

**File:** `components/Lab/BrowserInference.jsx`

```jsx
import { useState, useEffect, useRef } from 'react';
import * as ort from 'onnxruntime-web';

export default function BrowserInference({ modelPath, inputType = 'text' }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const session = await ort.InferenceSession.create(modelPath);
        setSession(session);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load model:', error);
        setLoading(false);
      }
    }
    loadModel();
  }, [modelPath]);

  async function runInference(input) {
    if (!session) return;

    // Prepare input tensor (implementation depends on model)
    const inputTensor = new ort.Tensor('float32', input, [1, input.length]);

    const feeds = { input: inputTensor };
    const results = await session.run(feeds);

    setResult(results.output.data);
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto mb-4" />
        <p>Loading model in browser...</p>
        <p className="text-sm text-[var(--color-text-muted)]">This runs entirely on your device</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {/* Input UI based on inputType */}
      {/* Results display */}
    </div>
  );
}
```

### 4.4 Model Playground Page

**File:** `pages/lab/playground.jsx`

```jsx
import { useState } from 'react';
import SEO from '@/components/SEO';

const AVAILABLE_MODELS = [
  {
    id: 'sentiment',
    name: 'Sentiment Classifier',
    description: 'Classify text as positive, negative, or neutral',
    inputType: 'text',
    endpoint: '/api/inference/sentiment'
  },
  {
    id: 'ner',
    name: 'Named Entity Recognition',
    description: 'Extract entities from text',
    inputType: 'text',
    endpoint: '/api/inference/ner'
  },
  {
    id: 'image-classify',
    name: 'Image Classifier',
    description: 'Classify images into categories',
    inputType: 'image',
    endpoint: '/api/inference/image-classify'
  }
];

export default function Playground() {
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(null);

  async function handleInference() {
    setLoading(true);
    const start = performance.now();

    const response = await fetch(selectedModel.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });

    const data = await response.json();
    setLatency(performance.now() - start);
    setResult(data);
    setLoading(false);
  }

  return (
    <>
      <SEO
        title="ML Playground - Josh Lowe"
        description="Try my machine learning models live in your browser"
      />

      <div className="section">
        <div className="container max-w-4xl">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">ML Playground</span>
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-8">
            Interactive demos of my trained models. All inference runs in real-time.
          </p>

          {/* Model selector */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {AVAILABLE_MODELS.map(model => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model)}
                className={`card p-4 text-left transition-all ${
                  selectedModel.id === model.id
                    ? 'border-[var(--color-primary)] shadow-glow-primary'
                    : ''
                }`}
              >
                <h3 className="font-semibold">{model.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {model.description}
                </p>
              </button>
            ))}
          </div>

          {/* Input area */}
          <div className="card p-6 mb-6">
            <label className="block text-sm font-medium mb-2">Input</label>
            {selectedModel.inputType === 'text' ? (
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={4}
                className="w-full p-4 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-[var(--color-text-primary)]"
                placeholder="Enter text to analyze..."
              />
            ) : (
              <input type="file" accept="image/*" />
            )}

            <button
              onClick={handleInference}
              disabled={loading || !input}
              className="mt-4 btn btn-primary"
            >
              {loading ? 'Running...' : 'Run Inference'}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Results</h3>
                {latency && (
                  <span className="text-sm text-[var(--color-text-muted)]">
                    Latency: {latency.toFixed(0)}ms
                  </span>
                )}
              </div>
              <pre className="bg-[var(--color-bg-surface)] p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

---

## Phase 5: Research & Paper Showcase

### 5.1 Research Page Structure

**File:** `pages/research/index.jsx`

Features:
- Grid of paper implementations
- Filter by year, venue, topic
- Sort by recency, difficulty
- Show reproduction accuracy vs. original

### 5.2 Paper Detail Page

**File:** `pages/research/[slug].jsx`

Sections:
1. Paper metadata (title, authors, venue, links)
2. TL;DR summary
3. Key contributions (bullet points)
4. My implementation approach
5. Results comparison (table or chart)
6. Lessons learned
7. Code snippets with syntax highlighting
8. Links to notebook, repo, trained weights

### 5.3 LaTeX Rendering

**File:** `components/Math/MathBlock.jsx`

```jsx
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

export function MathBlock({ children }) {
  return <BlockMath math={children} />;
}

export function InlineMathComponent({ children }) {
  return <InlineMath math={children} />;
}

// Custom markdown renderer with LaTeX support
export function MarkdownWithMath({ content }) {
  // Parse $$ for block math and $ for inline math
  // Render with react-markdown + custom components
}
```

---

## Phase 6: SEO & Recruiter Optimization

### 6.1 Enhanced Schema.org Markup

**File:** `components/SEO.jsx` (Enhanced)

```jsx
export default function SEO({
  title,
  description,
  type = 'website',
  article,
  project,
  person
}) {
  const structuredData = [];

  // Person schema (for about page)
  if (person) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Josh Lowe',
      url: 'https://jlowe.ai',
      image: 'https://jlowe.ai/images/headshot.jpg',
      sameAs: [
        'https://github.com/joshlowe',
        'https://linkedin.com/in/joshlowe',
        'https://twitter.com/joshlowe'
      ],
      jobTitle: 'Machine Learning Engineer',
      alumniOf: {
        '@type': 'CollegeOrUniversity',
        name: 'Your University'
      },
      knowsAbout: [
        'Machine Learning',
        'Deep Learning',
        'Natural Language Processing',
        'Computer Vision',
        'MLOps'
      ]
    });
  }

  // SoftwareSourceCode schema (for projects)
  if (project) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: project.title,
      description: project.shortDescription,
      codeRepository: project.repositoryLink,
      programmingLanguage: project.techStack?.languages,
      author: {
        '@type': 'Person',
        name: 'Josh Lowe'
      }
    });
  }

  // Article schema (for blog posts)
  if (article) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: article.title,
      description: article.description,
      author: {
        '@type': 'Person',
        name: 'Josh Lowe'
      },
      datePublished: article.datePublished,
      dateModified: article.updatedAt
    });
  }

  return (
    <Head>
      {/* ... existing meta tags ... */}

      {structuredData.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </Head>
  );
}
```

### 6.2 Recruiter-Focused CTAs

**File:** `components/RecruiterCTA.jsx`

```jsx
export default function RecruiterCTA({ variant = 'banner' }) {
  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] p-4 text-center text-white">
        <p className="font-semibold">
          Seeking Summer 2026 ML Internship
          <a
            href="/contact"
            className="ml-4 underline hover:no-underline"
          >
            Let's Connect →
          </a>
        </p>
      </div>
    );
  }

  if (variant === 'sticky') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] p-4">
        <div className="container flex justify-between items-center">
          <div>
            <p className="font-semibold">Interested in my work?</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              I'm looking for Summer 2026 ML internships
            </p>
          </div>
          <div className="flex gap-3">
            <a href="/resume.pdf" className="btn btn-secondary">
              Download Resume
            </a>
            <a href="/contact" className="btn btn-primary">
              Contact Me
            </a>
          </div>
        </div>
      </div>
    );
  }
}
```

### 6.3 Analytics Implementation

**File:** `components/Analytics.jsx`

```jsx
import Script from 'next/script';

export default function Analytics() {
  return (
    <>
      {/* Plausible Analytics (privacy-friendly) */}
      <Script
        defer
        data-domain="jlowe.ai"
        src="https://plausible.io/js/script.js"
      />

      {/* Microsoft Clarity for heatmaps */}
      <Script id="clarity">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            // ... Clarity script
          })(window, document, "clarity", "script", "YOUR_CLARITY_ID");
        `}
      </Script>
    </>
  );
}
```

### 6.4 Custom Event Tracking

**File:** `lib/analytics.js`

```javascript
export function trackEvent(eventName, properties = {}) {
  // Plausible
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, { props: properties });
  }

  // Also log to our database for detailed analysis
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, properties })
  }).catch(() => {});  // Fire and forget
}

// Predefined events
export const EVENTS = {
  RESUME_DOWNLOAD: 'resume_download',
  PROJECT_VIEW: 'project_view',
  DEMO_INTERACTION: 'demo_interaction',
  CHAT_STARTED: 'chat_started',
  CONTACT_CLICK: 'contact_click',
  GITHUB_CLICK: 'github_click'
};
```

---

## Phase 7: Competition & Achievements

### 7.1 Kaggle Integration

**File:** `lib/kaggle/api.js`

```javascript
export async function fetchKaggleProfile(username) {
  // Kaggle doesn't have a public API, so we'll need to:
  // 1. Use a scraper (not recommended)
  // 2. Manually update via admin
  // 3. Use their private API with authentication

  // For now, store competition data in database and update manually
}
```

### 7.2 Competitions Page

**File:** `pages/competitions/index.jsx`

Display:
- Competition cards with medals
- Rank and percentile
- Key techniques used
- Links to solutions

---

## Phase 8: Site Structure Reorganization

### 8.1 New Navigation Structure

```
Home
├── Projects (with category tabs)
│   ├── Featured ML
│   ├── Research
│   ├── Engineering
│   └── Archive
├── Lab
│   ├── Playground
│   └── Individual Demos
├── Research
│   └── Paper Implementations
├── Articles
│   └── Blog Posts
├── About
│   └── Skills, Experience, Education
└── Contact
```

### 8.2 Updated Header Component

**Modifications to:** `components/Header.jsx`

Add dropdown menus for Projects and Lab sections.

### 8.3 Homepage Restructure

**Modifications to:** `pages/index.jsx`

New sections order:
1. Hero (existing)
2. **ML Highlights** (NEW - top 3 ML projects with interactive previews)
3. **Ask My Portfolio** CTA (NEW - chatbot teaser)
4. Services (existing, but repositioned)
5. GitHub Activity (existing)
6. Recent Articles (existing)
7. **Recruiter CTA** (NEW)

---

## Implementation Phases & Order

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema extensions (migrations)
- [ ] New dependencies installation
- [ ] Environment variables setup
- [ ] Project category system

### Phase 2: ML Visualizations (Week 2-3)
- [ ] Create `components/MLViz/` directory
- [ ] Implement core visualization components
- [ ] Integrate with existing project pages
- [ ] Add to admin for data entry

### Phase 3: RAG Chatbot (Week 3-4)
- [ ] Knowledge ingestion pipeline
- [ ] Vector search implementation
- [ ] Chat API endpoint
- [ ] Chat UI component
- [ ] Integration with site layout

### Phase 4: Live Inference (Week 4-5)
- [ ] Set up Hugging Face Spaces
- [ ] Create inference API endpoints
- [ ] Build playground UI
- [ ] Individual model demo pages

### Phase 5: Research Section (Week 5-6)
- [ ] Research page templates
- [ ] LaTeX rendering
- [ ] Paper detail pages
- [ ] Admin interface for papers

### Phase 6: SEO & Analytics (Week 6)
- [ ] Schema.org markup
- [ ] Analytics implementation
- [ ] Event tracking
- [ ] Recruiter CTAs

### Phase 7: Site Restructure (Week 6-7)
- [ ] Navigation updates
- [ ] Homepage redesign
- [ ] Project categorization
- [ ] Skills-evidence linking

### Phase 8: Polish & Testing (Week 7-8)
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Cross-browser testing

---

## File Creation Summary

### New Pages
| File | Purpose |
|------|---------|
| `pages/lab/index.jsx` | ML Lab landing |
| `pages/lab/playground.jsx` | Multi-model playground |
| `pages/lab/[model-slug].jsx` | Individual demo |
| `pages/research/index.jsx` | Paper list |
| `pages/research/[slug].jsx` | Paper detail |
| `pages/competitions/index.jsx` | Competition history |
| `pages/projects/[slug]/demo.jsx` | Full-screen demo |

### New API Routes
| File | Purpose |
|------|---------|
| `pages/api/chat/index.js` | RAG chatbot |
| `pages/api/inference/[model].js` | Model inference |
| `pages/api/analytics/event.js` | Event tracking |
| `pages/api/embeddings/index.js` | Generate embeddings |
| `pages/api/admin/ml-projects.js` | ML project CRUD |
| `pages/api/admin/research.js` | Research CRUD |
| `pages/api/admin/competitions.js` | Competition CRUD |

### New Components
| Directory | Components |
|-----------|------------|
| `components/MLViz/` | TrainingCurves, ConfusionMatrix, FeatureImportance, ModelArchitecture, MetricsCard, etc. |
| `components/Chat/` | PortfolioChat, ChatMessage, ChatInput |
| `components/Lab/` | ModelSelector, InferenceInput, ResultDisplay, BrowserInference |
| `components/Research/` | PaperCard, PaperDetail, ResultsComparison |
| `components/Math/` | MathBlock, InlineMath, MarkdownWithMath |
| `components/Analytics/` | Analytics, EventTracker |
| `components/Recruiter/` | RecruiterCTA, HireMeBanner |

### New Library Files
| Directory | Files |
|-----------|-------|
| `lib/rag/` | ingest.js, search.js, openai.js, vectorStore.js |
| `lib/inference/` | huggingface.js, onnx.js |
| `lib/analytics/` | events.js, tracker.js |
| `lib/utils/` | projectCategories.js |

### Database Migrations
| Migration | Changes |
|-----------|---------|
| `add_ml_projects` | MLProject model |
| `add_knowledge_base` | KnowledgeChunk, ChatSession, ChatMessage |
| `add_research` | ResearchPaper model |
| `add_competitions` | Competition model |
| `add_analytics` | AnalyticsEvent model |
| `add_project_category` | category field on Project |

---

## Success Metrics

### Recruiter Engagement
- Resume downloads per month
- Average time on ML project pages
- Chat interactions per visitor
- Demo completion rates

### Technical Excellence
- Lighthouse score > 90
- Core Web Vitals passing
- Model inference latency < 2s
- Search accuracy (RAG relevance)

### Content Quality
- Number of ML projects with demos
- Paper implementations count
- Blog posts per month
- GitHub stars on showcased projects

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| API costs (OpenAI, HF) | Set rate limits, cache embeddings, use smaller models |
| Cold start latency | Pre-warm inference endpoints, use browser inference |
| Maintenance burden | Prioritize automation, good admin UX |
| Content staleness | Set up content calendar, GitHub activity auto-update |
| Mobile performance | Lazy load visualizations, simplify mobile demos |

---

## Next Steps

1. **Confirm scope** - Which phases are highest priority?
2. **Audit existing ML projects** - What can be demonstrated?
3. **Set up external services** - OpenAI, Hugging Face, Plausible
4. **Begin Phase 1** - Database migrations and dependencies

Ready to proceed with implementation upon approval.
