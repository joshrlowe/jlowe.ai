import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { CORPUS_INDEX } from "../index.generated.js";
import { evaluateRetrieval, type GoldenQuery } from "./eval.js";
import { corpusFingerprint } from "./fingerprint.js";

const dir = dirname(fileURLToPath(import.meta.url));

interface GoldenFile {
  corpusFingerprint: string;
  embedModel: string;
  dimensions: number;
  queries: GoldenQuery[];
}

function loadGolden(): GoldenFile {
  return JSON.parse(
    readFileSync(join(dir, "queries.json"), "utf8"),
  ) as GoldenFile;
}

describe("golden retrieval (tier 1, no AWS)", () => {
  const golden = loadGolden();

  it("query vectors match the committed corpus fingerprint (run `pnpm eval:golden` on drift)", () => {
    expect(corpusFingerprint(CORPUS_INDEX)).toBe(golden.corpusFingerprint);
    expect(golden.embedModel).toBe("amazon.titan-embed-text-v2:0");
    expect(golden.dimensions).toBe(1024);
    expect(golden.queries.length).toBeGreaterThanOrEqual(5);
  });

  it("recall@5 is 1.0 and MRR is at least 0.5 against committed vectors", async () => {
    const report = await evaluateRetrieval(golden.queries, { k: 5 });
    const misses = report.scores.filter((s) => !s.hit);
    expect(misses, JSON.stringify(misses)).toEqual([]);
    expect(report.recallAtK).toBe(1);
    expect(report.mrr).toBeGreaterThanOrEqual(0.5);
  });
});
