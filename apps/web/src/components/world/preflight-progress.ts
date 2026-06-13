/** Latch progress to its max-seen so the bar never regresses when drei's
 *  useProgress dips as new assets queue mid-load. */
export function latchProgress(prev: number, next: number): number {
  return next > prev ? next : prev;
}

/** Human label for the current loading item (a URL) or a fallback. */
export function loadingLabel(item: string | undefined): string {
  if (!item) return "initializing renderer";
  const name = item.split("/").pop() || item;
  return `loading ${name}`;
}
