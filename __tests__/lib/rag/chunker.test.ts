import { chunkMarkdown } from "../../../lib/rag/chunker";

const longBody = (paras: number, sentencesPer: number) =>
  Array.from({ length: paras })
    .map((_, p) =>
      Array.from({ length: sentencesPer })
        .map(
          (_, s) =>
            `Paragraph ${p + 1} sentence ${s + 1} with enough words to feel like real content.`
        )
        .join(" ")
    )
    .join("\n\n");

describe("chunkMarkdown", () => {
  it("returns [] for empty input", () => {
    expect(chunkMarkdown("")).toEqual([]);
    expect(chunkMarkdown("   \n  ")).toEqual([]);
  });

  it("returns [] for content below MIN_TOKENS", () => {
    expect(chunkMarkdown("# Tiny\n\nshort.")).toEqual([]);
  });

  it("captures heading path", () => {
    const md = `# Top\n\n## Sub\n\n${longBody(5, 5)}`;
    const chunks = chunkMarkdown(md);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].headingPath).toEqual(["Top", "Sub"]);
  });

  it("truncates deeper levels on a new same-or-higher heading", () => {
    const md = `# A\n\n## B\n\n${longBody(3, 5)}\n\n# C\n\n${longBody(3, 5)}`;
    const chunks = chunkMarkdown(md);
    const aChunk = chunks.find((c) => c.headingPath[0] === "A");
    const cChunk = chunks.find((c) => c.headingPath[0] === "C");
    expect(aChunk?.headingPath).toEqual(["A", "B"]);
    expect(cChunk?.headingPath).toEqual(["C"]);
  });

  it("keeps a code block intact even when oversized", () => {
    const codeLines = Array.from({ length: 200 })
      .map((_, i) => `console.log("line ${i}");`)
      .join("\n");
    const md = `# Code\n\n\`\`\`js\n${codeLines}\n\`\`\``;
    const chunks = chunkMarkdown(md);
    const codeChunk = chunks.find((c) => c.content.includes("console.log"));
    expect(codeChunk).toBeDefined();
    expect(codeChunk!.content.match(/console\.log/g)?.length).toBe(200);
  });

  it("emits chunkIndex starting at 0", () => {
    const md = `# H\n\n${longBody(20, 8)}`;
    const chunks = chunkMarkdown(md);
    expect(chunks[0].chunkIndex).toBe(0);
    chunks.forEach((c, i) => expect(c.chunkIndex).toBe(i));
  });

  it("token counts are positive", () => {
    const md = `# H\n\n${longBody(2, 6)}`;
    const chunks = chunkMarkdown(md);
    chunks.forEach((c) => expect(c.tokenCount).toBeGreaterThan(0));
  });
});
