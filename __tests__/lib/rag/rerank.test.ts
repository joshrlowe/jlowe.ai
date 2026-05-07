import { rerankCandidates } from "../../../lib/rag/rerank";

const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_ENV = { ...process.env };

describe("rerankCandidates", () => {
  beforeEach(() => {
    process.env.COHERE_API_KEY = "";
    global.fetch = jest.fn();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    process.env = { ...ORIGINAL_ENV };
    jest.restoreAllMocks();
  });

  const candidates = [
    { id: "a", content: "AAA", score: 0.5 },
    { id: "b", content: "BBB", score: 0.4 },
  ];

  it("returns input unchanged and never calls fetch when API key missing", async () => {
    const result = await rerankCandidates("q", candidates);
    expect(result).toEqual(candidates);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns input unchanged when candidates is empty", async () => {
    process.env.COHERE_API_KEY = "key";
    const result = await rerankCandidates("q", []);
    expect(result).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("reorders results when Cohere returns 200", async () => {
    process.env.COHERE_API_KEY = "key";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { index: 1, relevance_score: 0.9 },
          { index: 0, relevance_score: 0.3 },
        ],
      }),
    });
    const result = await rerankCandidates("q", candidates);
    expect(result.map((r) => r.id)).toEqual(["b", "a"]);
    expect(result[0].rerankScore).toBe(0.9);
    expect(result[0].score).toBe(0.9);
  });

  it("falls open with a warning on 429", async () => {
    process.env.COHERE_API_KEY = "key";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 429,
    });
    const result = await rerankCandidates("q", candidates);
    expect(result).toEqual(candidates);
    expect(console.warn).toHaveBeenCalled();
  });

  it("falls open with a warning when fetch throws", async () => {
    process.env.COHERE_API_KEY = "key";
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network"));
    const result = await rerankCandidates("q", candidates);
    expect(result).toEqual(candidates);
    expect(console.warn).toHaveBeenCalled();
  });
});
