/**
 * Mock for @prisma/client to support jsdom test environment
 * with customExportConditions=[''] (set for MSW compatibility).
 *
 * Only stubs the runtime values our source code actually touches.
 * Prisma model types are erased at compile time and do not need stubs.
 */

const Prisma = {
  JsonNull: null,
  DbNull: null,
  AnyNull: null,
  /**
   * Faithful-enough Prisma.sql: a tagged template returning the pieces the
   * real Sql object carries ({ strings, values, sql, text }) so tests can
   * inspect interpolated values without a database.
   */
  sql(strings, ...values) {
    return {
      strings: [...strings],
      values,
      sql: strings.join("?"),
      get text() {
        return strings.reduce((acc, s, i) => acc + s + (i < values.length ? `$${i + 1}` : ""), "");
      },
    };
  },
  join(values, separator = ",") {
    return { values, sql: values.map(() => "?").join(separator) };
  },
  raw(value) {
    return { sql: value, values: [] };
  },
};

class PrismaClient {
  constructor() {}
  $connect() {
    return Promise.resolve();
  }
  $disconnect() {
    return Promise.resolve();
  }
  $on() {}
  $use() {}
  $transaction(fn) {
    if (typeof fn === "function") return Promise.resolve(fn(this));
    return Promise.all(fn);
  }
}

module.exports = {
  Prisma,
  PrismaClient,
};
module.exports.default = module.exports;
