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
