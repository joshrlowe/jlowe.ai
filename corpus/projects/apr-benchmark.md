---
slug: apr-benchmark
title: Can LLMs fix each other's bugs?
kind: project
role: Researcher
stack: [Python, SWE-bench, Docker, LiteLLM, pytest]
outcomes:
  - An injector-by-repairer matrix — every model attempts every model's bugs — measuring self-bias alongside pass@k
  - Injected bugs earn their place only when the official SWE-bench Docker harness confirms the tests now fail
  - Cost-conscious by construction — dry runs, no-call cost estimates, and resumable phases that never pay twice for a finished evaluation
visibility: public
---

How well can a language model repair a bug written by a different model — or
by a human? This automated-program-repair benchmark puts models on both sides
of the problem. Each model injects faults into twenty curated SWE-bench Lite
instances, singly or compounded on top of the existing human-written bug, and
then every model — including the injector — attempts the repair, producing an
injector-by-repairer matrix that measures self-bias alongside standard pass@k.

The bugs are generated at run time and have to earn their place: an injection
only counts if its patch applies and the official SWE-bench Docker harness
confirms the tests now fail, and each repair is re-diffed against the original
repository so the unmodified harness can judge it. Around that sits the
unglamorous machinery of a multi-provider LLM experiment — defensive patch
extraction from free-form model output, per-model cost accounting with a
no-API-call estimate mode, and resumable phases that skip work already paid
for. An earlier arm of the same design runs on QuixBugs, with bootstrap
confidence intervals and significance tests built in for publication-grade
analysis.
