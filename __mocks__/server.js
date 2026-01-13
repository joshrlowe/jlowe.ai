/**
 * MSW Server for Node.js environment (Jest tests)
 * 
 * This server intercepts network requests during tests.
 * 
 * Note: MSW 2.x requires Node.js 18+ for full Fetch API support.
 * In environments without full Fetch API, the server will be null
 * and tests should use manual fetch mocking instead.
 */

let server = null;
let setupServer = null;
let handlers = [];

// Try to initialize MSW - it may fail in some environments
try {
  // Dynamic import to avoid errors during module loading
  const mswNode = require('msw/node');
  setupServer = mswNode.setupServer;
  
  const handlersModule = require('./handlers');
  handlers = handlersModule.handlers || [];
  
  server = setupServer(...handlers);
} catch {
  // MSW is not available - server remains null
  // This is expected in some test environments, so we silently fall back to manual mocks
}

/**
 * MSW server instance with all default handlers
 * May be null if MSW is not available
 */
export { server };

/**
 * Helper to add handlers temporarily for a single test
 * No-op if MSW is not available
 */
export const withHandlers = (additionalHandlers) => {
  if (server) {
    server.use(...additionalHandlers);
  }
};

/**
 * Helper to reset to default handlers
 * No-op if MSW is not available
 */
export const resetToDefaultHandlers = () => {
  if (server) {
    server.resetHandlers();
  }
};
