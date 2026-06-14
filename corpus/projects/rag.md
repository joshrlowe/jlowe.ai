---
slug: rag
title: RAG that cites its sources
kind: project
role: AI Engineer
stack: [AWS Bedrock, Titan Embeddings, pgvector, Reciprocal Rank Fusion]
outcomes:
  - Hybrid vector + keyword retrieval merged with RRF, then reranked
  - Numbered citations so users can trust — and check — the answer
  - Content-hash-gated re-embedding fanned out over background jobs
visibility: public
---

Retrieval-augmented generation only earns trust when it shows its work. Hybrid
search, reciprocal rank fusion, a rerank pass, and numbered citations — so the
model's answer points back at the source instead of asking you to take it on
faith.
