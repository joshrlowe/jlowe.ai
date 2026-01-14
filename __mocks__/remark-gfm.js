/**
 * Mock for remark-gfm
 * 
 * Returns a no-op plugin for testing
 */

export default function remarkGfm() {
  // No-op remark plugin
  return (tree) => tree;
}

