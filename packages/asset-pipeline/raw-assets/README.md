# raw-assets/

Drop raw, unoptimized source art here. The pipeline
(`pnpm --filter @velocity/asset-pipeline assets`) reads these and emits
**content-hashed**, web-ready assets to `apps/web/public/assets/` plus a
`manifest.json` mapping each source name to its hashed output.

Supported inputs:

| Input                    | Output                          | Notes                                  |
| ------------------------ | ------------------------------- | -------------------------------------- |
| `*.glb`                  | Draco/Meshopt glb (+ KTX2 maps) | geometry is pure-npm; KTX2 needs `ktx` |
| `*.hdr`                  | processed HDR environment map   | pure-npm                               |
| `*.jpg` `*.jpeg` `*.png` | KTX2 (Basis Universal) texture  | needs `ktx`                            |

Loose textures are named by role: `*_color`/`*_albedo` → sRGB, ETC1S/BasisLZ;
`*_normal`/`*_roughness`/`*_metalness`/`*_ao`/… → linear data, UASTC. Mipmaps
are baked in (compressed GPU formats can't be mip-generated at upload).

**These files are gitignored** (only this README + `.gitkeep` are tracked).
Raw sources are multi-MB build inputs, not ship artifacts — keep them out of
git; sync to S3 in a later phase if they outgrow local-only.

## KTX2 needs the KTX-Software `ktx` CLI on PATH

Easiest is `brew install ktx` (macOS). Without any `ktx`, the pipeline still
runs geometry compression and ships `.glb`-embedded textures uncompressed
(logging a warning); loose `.jpg`/`.png` inputs are skipped.

### Installing `ktx` without Homebrew (macOS, Apple Silicon)

Homebrew is optional. Khronos ships a signed `.pkg`; extract it into `~/bin`
with no sudo and no GUI:

```bash
ver=4.4.2
pkg="KTX-Software-$ver-Darwin-arm64.pkg"           # -x86_64 on Intel
gh release download "v$ver" -R KhronosGroup/KTX-Software -p "$pkg"   # or curl the release asset
xattr -dr com.apple.quarantine "$pkg"
pkgutil --expand-full "$pkg" ktx-expand

mkdir -p ~/bin
cp ktx-expand/*-tools.pkg/Payload/usr/local/bin/ktx              ~/bin/ktx
cp ktx-expand/*-library.pkg/Payload/usr/local/lib/libktx.4.4.2.dylib ~/bin/libktx.4.4.2.dylib
ln -sf libktx.4.4.2.dylib ~/bin/libktx.4.dylib                  # the name the binary dlopen's

# The binary loads @rpath/libktx.4.dylib; point @rpath next to the binary,
# then re-sign ad-hoc (install_name_tool invalidates the signature and arm64
# refuses to exec an invalidly-signed binary).
install_name_tool -add_rpath @loader_path ~/bin/ktx
codesign --force --sign - ~/bin/libktx.4.4.2.dylib ~/bin/ktx

~/bin/ktx --version        # → ktx version: v4.4.2
```

Put `~/bin` on your PATH (or prefix pipeline runs with `PATH="$HOME/bin:$PATH"`)
so the pipeline's `isKtxAvailable()` probe finds it.
