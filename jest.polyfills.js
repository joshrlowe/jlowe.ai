/**
 * Jest Polyfills
 * 
 * This file sets up polyfills required before any other setup.
 * It runs before jest.setup.js to ensure globals are available.
 * 
 * For MSW 2.x with Jest, additional polyfills are required.
 * See: https://mswjs.io/docs/integrations/node#setup
 */

const { TextEncoder, TextDecoder } = require('util');

// Polyfill TextEncoder/TextDecoder (required by many packages)
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill structuredClone if not available
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}

// Polyfill BroadcastChannel if not available
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage() {}
    close() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

/**
 * MSW 2.x Polyfills
 * 
 * Note: MSW 2.x requires Node.js 18+ or extensive polyfills.
 * The following attempts to polyfill the Fetch API.
 * 
 * If you're using Node.js 18+, these should be available natively.
 * For older Node.js versions, you may need to:
 * 1. Use MSW 1.x instead
 * 2. Or use node-fetch with custom configuration
 */
try {
  // MSW requires these globals to be defined from undici for proper interception
  const undici = require('undici');
  
  // Always set these from undici for MSW compatibility
  global.fetch = undici.fetch;
  global.Headers = undici.Headers;
  global.Request = undici.Request;
  global.Response = undici.Response;
  global.FormData = undici.FormData;
} catch (error) {
  // Fetch API not available - MSW will not work, but tests can still run
  console.warn('Fetch API polyfill failed:', error.message);
  console.warn('MSW may not work correctly. Consider using Node.js 18+');
}
