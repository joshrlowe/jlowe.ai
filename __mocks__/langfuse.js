/**
 * Mock for the langfuse SDK used in tests. Records every call so assertions
 * can verify trace/span/score interactions without network I/O.
 */

let _calls = [];

function makeSpan(traceId, name) {
  return {
    end: jest.fn((body) => _calls.push({ kind: "span.end", traceId, name, body })),
    update: jest.fn((body) => _calls.push({ kind: "span.update", traceId, name, body })),
  };
}

function makeGeneration(traceId, name) {
  return {
    end: jest.fn((body) => _calls.push({ kind: "generation.end", traceId, name, body })),
    update: jest.fn((body) => _calls.push({ kind: "generation.update", traceId, name, body })),
  };
}

function makeTrace(traceId) {
  return {
    id: traceId,
    span: jest.fn(({ name, ...rest }) => {
      _calls.push({ kind: "trace.span", traceId, name, body: rest });
      return makeSpan(traceId, name);
    }),
    generation: jest.fn(({ name, ...rest }) => {
      _calls.push({ kind: "trace.generation", traceId, name, body: rest });
      return makeGeneration(traceId, name);
    }),
    update: jest.fn((body) => _calls.push({ kind: "trace.update", traceId, body })),
  };
}

class Langfuse {
  constructor(opts) {
    _calls.push({ kind: "init", opts });
    this._traceCount = 0;
  }
  trace(body) {
    this._traceCount += 1;
    const id = `trace-${this._traceCount}`;
    _calls.push({ kind: "trace", id, body });
    return makeTrace(id);
  }
  score(body) {
    _calls.push({ kind: "score", body });
    return this;
  }
  flushAsync() {
    _calls.push({ kind: "flushAsync" });
    return Promise.resolve();
  }
  shutdownAsync() {
    _calls.push({ kind: "shutdownAsync" });
    return Promise.resolve();
  }
}

function __getCalls() {
  return [..._calls];
}

function __resetCalls() {
  _calls = [];
}

module.exports = {
  Langfuse,
  default: Langfuse,
  __getCalls,
  __resetCalls,
};
