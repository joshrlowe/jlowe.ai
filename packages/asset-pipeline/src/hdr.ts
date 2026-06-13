export interface HdrResult {
  bytes: Uint8Array;
  warning?: string;
}

const MAX_RECOMMENDED_BYTES = 6 * 1024 * 1024; // ~2k equirectangular .hdr

/**
 * Phase 1 ships HDR environment maps as-is (PMREM happens at runtime via drei
 * <Environment>); this just content-hashes them and warns if a file is larger
 * than a ~2k map. (Resizing .hdr/.exr needs a dedicated tool — sharp can't —
 * tracked as a TODO.)
 */
export function processHdr(input: Uint8Array): HdrResult {
  const warning =
    input.byteLength > MAX_RECOMMENDED_BYTES
      ? `HDR is ${(input.byteLength / 1024 / 1024).toFixed(1)} MB — resize to <=2k before shipping (resize tool TODO).`
      : undefined;
  return { bytes: input, warning };
}
