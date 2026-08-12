---
slug: jarvis
title: Jarvis — a self-hosted AI assistant
kind: project
role: AI Engineer
stack: [Python, TypeScript, LangGraph, FastAPI, pgvector, Ollama]
outcomes:
  - Contract-first monorepo — Pydantic models generate TypeScript, and one test suite must pass against both the mock and the real service
  - Human-in-the-loop approval gates that survive a process restart and resolve over WebSocket or REST, first answer wins
  - Local-first by design — models, memory, voice, and a code sandbox run on a home Mac Mini behind a private tailnet
visibility: public
---

Jarvis is a self-hosted personal AI assistant split between a home Mac Mini —
the brain: gateway, memory, local models, voice, code sandbox, skills — and a
VPS for public ingress, connected over a private Tailscale network. Local-first
is the point: a Qwen3 model served through Ollama, a pgvector memory store with
bi-temporal corrections (facts are superseded, never deleted), and a
wake-word-to-speech voice loop with barge-in all run on hardware at home.

The keystone is the contracts package. Every cross-service boundary is a
typed, versioned Pydantic model with generated TypeScript, a runnable
deterministic mock, and a contract test suite that any real implementation
must pass — so seven service tracks build in parallel against mocks and swap
in one at a time. The trickiest machinery is the approval gate: a LangGraph
interrupt pauses a streaming turn for a human decision, resolvable over
WebSocket or REST with first resolution winning, and durable enough to
survive a process restart mid-approval.
