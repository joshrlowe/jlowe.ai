---
slug: nutrillava
title: NutriLLaVA — recipes from a photo of your fridge
kind: project
role: ML Engineer
stack: [LLaVA, PyTorch, QLoRA, TRL, AWS SageMaker, Gradio]
outcomes:
  - Two-turn vision pipeline — name the ingredients in the photo, then write a recipe against the user's dietary goals
  - Fully synthetic training data — 1,000 FLUX-generated kitchen scenes paired with 4,000 GPT-4o instruction responses — after public food datasets proved unobtainable
  - QLoRA fine-tuning on SageMaker under hard cost and runtime guardrails enforced in code
visibility: public
---

NutriLLaVA generates personalized recipe suggestions from a photo of the
ingredients you have — a multimodal pipeline on LLaVA 1.6 that first names
what it sees, then feeds that back with the user's dietary goals to produce
a recipe. The zero-shot version runs the 34-billion-parameter model behind a
Gradio interface.

The deeper work is the fine-tuning experiment. Public food datasets turned
out to be dead links, gated downloads, and unlabeled images, so the training
set is fully synthetic — a thousand photorealistic kitchen scenes from
FLUX.1-dev, each paired with GPT-4o instruction–response pairs across four
dietary profiles, split so no image leaks between train and eval. A QLoRA
pipeline (4-bit, LoRA on the attention projections of LLaVA-NeXT 13B) trains
on SageMaker under a hard budget cap — and the honest ledger so far is that
the guardrails have outworked the training runs. The deliverable is the
pipeline and the debugging, not a benchmark number.
