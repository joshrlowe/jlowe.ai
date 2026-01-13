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
 * MSW 2.x Fetch API Setup
 * 
 * Node.js 18+ has native Fetch API support.
 * MSW 2.x requires specific globals from undici for proper request interception.
 * 
 * We use undici because:
 * 1. It's the same implementation Node.js uses internally
 * 2. MSW can properly intercept requests with undici globals
 * 3. It provides ReadableStream support needed by MSW
 */

// First, ensure ReadableStream is available (needed by undici)
if (typeof global.ReadableStream === 'undefined') {
  try {
    const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
    global.ReadableStream = ReadableStream;
    global.WritableStream = WritableStream;
    global.TransformStream = TransformStream;
  } catch {
    // stream/web not available in this Node.js version
  }
}

// Now set up undici globals for MSW
try {
  const { fetch, Headers, Request, Response, FormData } = require('undici');
  
  // Set undici globals for MSW compatibility
  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
  global.FormData = FormData;
} catch (error) {
  // If undici fails, fall back to native fetch if available (Node.js 18+)
  // This is silent - MSW tests will simply not run
}
