# raw-assets/

Drop raw, unoptimized source art here — `.glb` models and `.hdr` environment
maps. The pipeline (`pnpm --filter @velocity/asset-pipeline assets`) reads these
and emits **content-hashed**, web-ready assets to `apps/web/public/assets/`.

**These files are gitignored** (only this README + `.gitkeep` are tracked).
Raw sources are multi-MB build inputs, not ship artifacts — keep them out of
git; sync to S3 in a later phase if they outgrow local-only.

KTX2 texture compression needs KTX-Software on PATH: `brew install ktx`
(macOS). Without it, the pipeline still runs (geometry compression) and ships
textures uncompressed, logging a warning.
