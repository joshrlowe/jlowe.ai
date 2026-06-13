# corpus/

Source-of-truth content for the **AI digital twin**. Everything the twin may
say about Josh is grounded in files here — ingested (chunked → embedded →
indexed) by a later phase. This directory is **not** a workspace package and
has no build step.

## Layout

```
corpus/
  resume/      canonical resume + dated snapshots
  projects/    one markdown file per project (frontmatter: slug, title, dates, stack, outcomes)
  articles/    drafts and published writing
  faq/         question → answer pairs the twin can draw on
  persona/     voice, tone, and boundaries — what the twin may and may not claim
```

## Conventions

- **Format:** Markdown with YAML frontmatter.
- **Visibility:** every file declares `visibility: public | private` in frontmatter. Only `public` content is eligible for ingestion.
- **Provenance:** factual claims carry a source (link, doc, or `self-reported`) so the twin can cite or hedge appropriately.
- **No secrets / PII** beyond what is already publicly published. Content is reviewed before it is ingested.

## Boundaries (persona/)

The persona files define guardrails: the twin speaks as an assistant *about*
Josh, never *as* Josh; it declines to invent facts, quote private data, or make
commitments on his behalf. Keep these explicit and current.
