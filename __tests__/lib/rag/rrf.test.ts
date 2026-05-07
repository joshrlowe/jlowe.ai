import { rrfMerge } from "../../../lib/rag/rrf";

describe("rrfMerge", () => {
  it("returns empty for empty input", () => {
    expect(rrfMerge([])).toEqual([]);
    expect(rrfMerge([[]])).toEqual([]);
  });

  it("computes 1/(k+rank+1) per ranking", () => {
    const result = rrfMerge([[{ id: "a" }, { id: "b" }]]);
    // a is at rank 0 -> 1/61, b at rank 1 -> 1/62
    expect(result[0]).toEqual({ id: "a", score: 1 / 61 });
    expect(result[1]).toEqual({ id: "b", score: 1 / 62 });
  });

  it("an id present in both rankings outranks one in only one", () => {
    const both = [{ id: "shared" }, { id: "only_a" }];
    const otherList = [{ id: "shared" }, { id: "only_b" }];
    const result = rrfMerge([both, otherList]);
    const ids = result.map((r) => r.id);
    expect(ids[0]).toBe("shared");
    // shared appears in both at rank 0, so score = 2 / 61
    const shared = result.find((r) => r.id === "shared")!;
    expect(shared.score).toBeCloseTo(2 / 61);
  });

  it("respects custom k", () => {
    const result = rrfMerge([[{ id: "a" }]], { k: 0 });
    expect(result[0].score).toBeCloseTo(1);
  });

  it("truncates with topN", () => {
    const result = rrfMerge(
      [
        [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
      ],
      { topN: 2 },
    );
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });
});
