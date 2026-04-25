/* ============================================
   Supernova — 3D volumetric build
   Pink/purple/blue palette. Real depth.

   What's 3D here:
   • 3D particle burst (1200 debris points) radiating spherically from origin
   • Nebula clouds distributed across deep Z (-30 to -200) with real parallax
   • Camera dolly forward during explosion (pushes through the blast)
   • Billboarded shader sprites rotate in 3D space
   • Starfield stays (already 3D)

   Simplified vs. previous: no chromatic aberration, single-pass warp,
   one-ring shockwave, 1800 stars.
   ============================================ */

(function () {
  const ready = () => new Promise((res) => {
    if (document.readyState !== 'loading') res();
    else document.addEventListener('DOMContentLoaded', res);
  });

  // ---- Timeline (seconds) ----
  // Condense: 0 → T_ABSORB (beams stream in, core grows and absorbs them)
  // Hold:     T_ABSORB → T_DETONATE (charged core, ~1s of stillness)
  // Detonate: T_DETONATE → T_SHOCK_END (shells expand, debris bursts, flash)
  const T_ABSORB     = 1.8;  // beams fully absorbed, core at peak
  const T_DETONATE   = 2.8;  // ~1s hold
  const T_FLASH_FADE = 3.1;
  const T_SHOCK_END  = 4.8;
  const T_COMPLETE   = 5.2;

  const EXPLOSION_SPEED_FACTOR = 1.4;
  const AMBIENT_ROTATION_SPEED = 0.003;

  const STAR_COUNT = 1800;
  const DEBRIS_COUNT = 1200;
  const STAR_MIN_RADIUS = 20;
  const STAR_MAX_RADIUS_FACTOR = 100;

  const CAMERA_POSITION_Z = 18;
  const CAMERA_FOV = 60;
  const MOUSE_POS_X = 8, MOUSE_POS_Y = 5;
  const MOUSE_ROT_X = 0.15, MOUSE_ROT_Y = 0.25;
  const CAM_FOLLOW = 0.04, ROT_LERP = 0.03;

  // Cyan / electric blue / white stars
  const STAR_COLOR_HEX = [
    '#FFFFFF', '#F0F9FF', '#E0F2FE',
    '#A5F3FC', '#67E8F9', '#22D3EE', // cyans
    '#93C5FD', '#60A5FA', '#3B82F6', // electric blues
    '#CBD5E1', '#94A3B8',            // steel
  ];
  const COLOR_WEIGHTS = [26, 10, 8, 10, 8, 5, 10, 8, 5, 6, 4];
  const TOTAL_WEIGHT = COLOR_WEIGHTS.reduce((a, b) => a + b, 0);

  function hexToRgb(hex) {
    const m = hex.replace('#', '');
    const n = parseInt(m, 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
  }
  const STAR_COLORS_RGB = STAR_COLOR_HEX.map(hexToRgb);
  function weightedStarColor() {
    let r = Math.random() * TOTAL_WEIGHT;
    for (let i = 0; i < COLOR_WEIGHTS.length; i++) {
      r -= COLOR_WEIGHTS[i];
      if (r <= 0) return STAR_COLORS_RGB[i];
    }
    return STAR_COLORS_RGB[0];
  }

  // 3-octave fbm (kept light)
  const GLSL_NOISE = `
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p); vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0; float a = 0.5;
      v += a * noise(p); p *= 2.07; a *= 0.5;
      v += a * noise(p); p *= 2.07; a *= 0.5;
      v += a * noise(p);
      return v;
    }
  `;

  async function init() {
    await ready();
    if (!window.THREE) { setTimeout(init, 50); return; }

    const mount = document.getElementById('supernova-canvas');
    if (!mount) return;

    const THREE = window.THREE;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      CAMERA_FOV, window.innerWidth / window.innerHeight, 0.1, 4000
    );
    camera.position.set(0, 0, CAMERA_POSITION_Z);

    const renderer = new THREE.WebGLRenderer({
      antialias: true, alpha: true, powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // transparent — body gradient shows through
    mount.appendChild(renderer.domElement);

    // ============================================
    // Distant starfield (3D sphere)
    // ============================================
    function createStarGeometry(count) {
      const positions = new Float32Array(count * 3);
      const finalPositions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        const radius = STAR_MIN_RADIUS + Math.pow(Math.random(), 0.4) * STAR_MAX_RADIUS_FACTOR;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        finalPositions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
        finalPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        finalPositions[i * 3 + 2] = radius * Math.cos(phi);
        const col = weightedStarColor();
        colors[i * 3]     = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
        const roll = Math.random();
        sizes[i] = roll > 0.95 ? 4 + Math.random() * 3
                  : roll > 0.75 ? 2 + Math.random() * 2
                  : 0.8 + Math.random() * 1.4;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      g.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
      g.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      return { geometry: g, finalPositions };
    }
    const { geometry: starGeo, finalPositions } = createStarGeometry(STAR_COUNT);
    const starMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;
        void main() {
          vColor = customColor;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (280.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, d);
          float glow = exp(-d * 4.0);
          gl_FragColor = vec4(vColor, alpha * glow);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(starGeo, starMat);
    scene.add(points);

    // ============================================
    // 3D DEBRIS PARTICLES — this is the 3D supernova burst.
    // Each particle: origin (0,0,0) → random direction × distance × speed.
    // Instead of moving them every frame on CPU, the shader interpolates
    // using a progress uniform. Way cheaper and smoother.
    // ============================================
    const debrisGeo = new THREE.BufferGeometry();
    const dirArray  = new Float32Array(DEBRIS_COUNT * 3); // unit direction
    const distArray = new Float32Array(DEBRIS_COUNT);     // max distance
    const delayArr  = new Float32Array(DEBRIS_COUNT);     // 0..1 offset when particle "launches"
    const dSizeArr  = new Float32Array(DEBRIS_COUNT);
    const dColArr   = new Float32Array(DEBRIS_COUNT * 3);

    // Palette for debris — cyan, electric blue, white, navy, steel
    const DEBRIS_COLORS = [
      [1.00, 1.00, 1.00], // pure white
      [0.65, 0.95, 1.00], // ice cyan
      [0.13, 0.83, 0.93], // cyan
      [0.38, 0.65, 0.99], // sky blue
      [0.23, 0.51, 0.96], // electric blue
      [0.12, 0.23, 0.54], // deep navy
      [0.45, 0.50, 0.58], // steel
    ];

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      // Random 3D unit vector (uniform sphere)
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      dirArray[i * 3]     = Math.sin(phi) * Math.cos(theta);
      dirArray[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      dirArray[i * 3 + 2] = Math.cos(phi);

      // Varied max distances so debris spreads unevenly
      distArray[i] = 8 + Math.pow(Math.random(), 0.5) * 60;
      delayArr[i]  = Math.random() * 0.35; // stagger launch 0..0.35
      dSizeArr[i]  = 1.2 + Math.random() * 4.5;

      const c = DEBRIS_COLORS[Math.floor(Math.random() * DEBRIS_COLORS.length)];
      dColArr[i * 3]     = c[0];
      dColArr[i * 3 + 1] = c[1];
      dColArr[i * 3 + 2] = c[2];
    }

    // Need a position attribute even if shader computes it
    debrisGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DEBRIS_COUNT * 3), 3));
    debrisGeo.setAttribute('aDir',   new THREE.BufferAttribute(dirArray, 3));
    debrisGeo.setAttribute('aDist',  new THREE.BufferAttribute(distArray, 1));
    debrisGeo.setAttribute('aDelay', new THREE.BufferAttribute(delayArr, 1));
    debrisGeo.setAttribute('aSize',  new THREE.BufferAttribute(dSizeArr, 1));
    debrisGeo.setAttribute('aColor', new THREE.BufferAttribute(dColArr, 3));

    const debrisMat = new THREE.ShaderMaterial({
      vertexShader: `
        attribute vec3  aDir;
        attribute float aDist;
        attribute float aDelay;
        attribute float aSize;
        attribute vec3  aColor;
        uniform float uProgress; // 0..1 explosion progress
        uniform float uLife;     // 0..1 fade-out progress (0 = alive, 1 = gone)
        varying vec3  vColor;
        varying float vAlpha;

        float easeOutCubic(float t) { return 1.0 - pow(1.0 - t, 3.0); }

        void main() {
          // Per-particle progress with stagger
          float p = clamp((uProgress - aDelay) / (1.0 - aDelay), 0.0, 1.0);
          p = easeOutCubic(p);

          vec3 pos = aDir * aDist * p;
          vec4 mv  = modelViewMatrix * vec4(pos, 1.0);

          gl_PointSize = aSize * (240.0 / -mv.z) * (1.0 - uLife * 0.7);
          gl_Position  = projectionMatrix * mv;

          vColor = aColor;
          // Fade each particle as it travels + global fade
          float travelFade = 1.0 - smoothstep(0.7, 1.0, p);
          vAlpha = travelFade * (1.0 - uLife);
        }
      `,
      fragmentShader: `
        varying vec3  vColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float core = exp(-d * 6.0);
          float halo = 1.0 - smoothstep(0.0, 0.5, d);
          gl_FragColor = vec4(vColor, (core * 0.9 + halo * 0.25) * vAlpha);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uLife:     { value: 1 }, // starts "gone" until explosion
      },
    });
    const debris = new THREE.Points(debrisGeo, debrisMat);
    scene.add(debris);

    // ============================================
    // Stellar core — simple pink/magenta/violet glow (billboard)
    // ============================================
    const coreMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uSize;
        uniform float uIntensity;

        void main() {
          vec2 uv = vUv - 0.5;
          float r = length(uv) * 2.0;

          float body = smoothstep(uSize, 0.0, r);
          body = pow(body, 1.6);
          float halo = pow(smoothstep(1.0, 0.0, r), 2.0) * 0.5;

          // white → ice → cyan → electric blue → deep navy
          vec3 c0 = vec3(1.00, 1.00, 1.00);
          vec3 c1 = vec3(0.65, 0.95, 1.00);
          vec3 c2 = vec3(0.13, 0.83, 0.93);
          vec3 c3 = vec3(0.12, 0.23, 0.54);
          float t = clamp(r / max(0.01, uSize), 0.0, 1.0);
          vec3 col = mix(c0, c1, smoothstep(0.0, 0.4, t));
          col = mix(col, c2, smoothstep(0.4, 0.75, t));
          col = mix(col, c3, smoothstep(0.75, 1.0, t));

          float alpha = (body + halo * 0.6) * uIntensity;
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uSize:      { value: 0.0 },
        uIntensity: { value: 0.0 },
      },
    });
    const coreMesh = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), coreMat);
    coreMesh.position.set(0, 0, 6);
    scene.add(coreMesh);

    // ============================================
    // Accretion beams — radial shafts of light streaming INTO the core
    // during the condense phase. Drawn as a billboard plane behind the
    // core with a fragment shader that paints N narrow rays converging
    // on center, modulated by noise so they shimmer and flicker.
    // ============================================
    const beamMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uIntensity;   // 0..1 master strength
        uniform float uPull;        // 0..1 how far beams extend inward (1 = reach center)
        uniform float uTime;
        ${GLSL_NOISE}

        // Hash for per-beam variation
        float hash11(float n) { return fract(sin(n * 43758.5453) * 12345.6789); }

        void main() {
          // Center the UV, scale so the disc fills the plane nicely
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);
          float ang = atan(p.y, p.x);             // -PI..PI

          // ~14 beams around the circle (fewer + much thicker).
          const float NB = 14.0;
          float a = (ang / 6.2831853) + 0.5;       // 0..1
          float bIdx = floor(a * NB);
          float bFrac = fract(a * NB);             // 0..1 within beam slot

          // Per-beam random width, brightness, time offset
          float seed = hash11(bIdx);
          float width  = mix(0.40, 0.50, hash11(bIdx + 17.3));
          float bright = mix(0.55, 1.15, hash11(bIdx + 91.1));
          float tOff   = hash11(bIdx + 5.7) * 6.28;

          // Tight Gaussian-ish profile across the beam
          float d = abs(bFrac - 0.5);
          float beam = smoothstep(width, 0.0, d);
          beam = pow(beam, 2.4);

          // Inward extent: beams start short and stretch toward the center as
          // condense progresses. uPull 0 = only outer edge, 1 = reach center.
          // Inner cutoff travels from 0.95 → 0.0 as uPull rises.
          float innerCut = mix(0.92, 0.02, uPull);
          float outerCut = 1.05;
          float radial = smoothstep(innerCut, innerCut + 0.18, r) *
                         smoothstep(outerCut, outerCut - 0.25, r);

          // Subtle taper toward center (bright tip, fading tail outward)
          float taper = pow(smoothstep(1.0, innerCut, r), 0.7);

          // Shimmer: noise along the beam length so each ray flickers/streams
          float flow = fbm(vec2(r * 6.0 - uTime * 1.6 + tOff, seed * 9.0));
          float shimmer = 0.55 + 0.55 * flow;

          // Per-beam pulse so a few rays fire brighter at any moment
          float pulse = 0.5 + 0.5 * sin(uTime * 2.4 + tOff * 3.0);
          pulse = mix(0.7, 1.4, pulse * hash11(bIdx + 0.3));

          float a_beam = beam * radial * taper * shimmer * pulse * bright;

          // Cool palette to match cyan/electric-blue scheme
          vec3 colCool = vec3(0.55, 0.92, 1.00);   // cyan
          vec3 colHot  = vec3(0.95, 0.99, 1.00);   // near-white tip
          vec3 col = mix(colCool, colHot, taper);

          float alpha = a_beam * uIntensity;
          gl_FragColor = vec4(col * alpha * 2.2, alpha);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uIntensity: { value: 0.0 },
        uPull:      { value: 0.0 },
        uTime:      { value: 0.0 },
      },
    });
    // Slightly larger than the core so beams reach out into space.
    const beamMesh = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), beamMat);
    beamMesh.position.set(0, 0, 5.5); // just behind the core (core is at z=6)
    scene.add(beamMesh);

    // ============================================
    // Shockwave — REAL 3D tori, tilted. Three nested shells staggered
    // in time, like the reference image. Each torus has its own
    // expanding radius animated via a uniform scale on the geometry.
    // ============================================
    // We build 3 tori at unit radius and scale them up over time.
    // Colors: inner = cyan, outer = magenta.
    const shockGroup = new THREE.Group();
    // Tilt the whole group so rings read as ellipses (not circles from front)
    shockGroup.rotation.x = THREE.MathUtils.degToRad(-62);
    shockGroup.rotation.z = THREE.MathUtils.degToRad(12);
    shockGroup.position.set(0, 0, 4);
    scene.add(shockGroup);

    function makeTorus(color, thicknessR) {
      // Radius 1 base, we'll scale it.
      const g = new THREE.TorusGeometry(1, thicknessR, 24, 160);
      const m = new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vPos;
          void main() {
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec3 vPos;
          uniform vec3 uColor;
          uniform float uIntensity;
          uniform float uTime;
          uniform float uSeed;
          ${GLSL_NOISE}
          void main() {
            // Angle around the torus ring
            float ang = atan(vPos.y, vPos.x);
            // Break up the ring so it looks torn/wispy, not a CGI toroid
            float breakup = 0.55 + 0.45 * fbm(vec2(ang * 4.0 + uSeed * 7.3, uTime * 0.6 + uSeed));
            breakup = smoothstep(0.3, 1.0, breakup);
            vec3 col = uColor * (1.2 + breakup * 0.6);
            gl_FragColor = vec4(col * uIntensity * breakup, uIntensity * breakup * 0.9);
          }
        `,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uColor:     { value: new THREE.Color(color) },
          uIntensity: { value: 0.0 },
          uTime:      { value: 0.0 },
          uSeed:      { value: Math.random() * 10 },
        },
      });
      return new THREE.Mesh(g, m);
    }

    // Three shells: outer electric blue (biggest reach), mid cyan, inner white-hot
    const shells = [
      { mesh: makeTorus('#3B82F6', 0.025), maxR: 42, delay: 0.00, thickScale: 1.0 },  // outer electric blue
      { mesh: makeTorus('#22D3EE', 0.020), maxR: 34, delay: 0.12, thickScale: 0.8 },  // mid cyan
      { mesh: makeTorus('#F0F9FF', 0.018), maxR: 26, delay: 0.22, thickScale: 0.7 },  // inner white-hot
    ];
    shells.forEach((s) => {
      s.mesh.scale.set(0.001, 0.001, 0.001);
      shockGroup.add(s.mesh);
    });

    // ============================================
    // Flash fullscreen
    // ============================================
    const flashMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uStrength;
        uniform vec2 uResolution;
        void main() {
          vec2 p = vUv - 0.5;
          p.x *= uResolution.x / uResolution.y;
          float r = length(p) * 2.0;
          float falloff = pow(smoothstep(1.2, 0.0, r), 1.8);
          float core = pow(smoothstep(0.35, 0.0, r), 3.0);
          vec3 col = mix(vec3(0.23, 0.51, 0.96), vec3(0.95, 0.99, 1.0), core);
          gl_FragColor = vec4(col * uStrength * (falloff + core), falloff * uStrength * 0.6);
        }
      `,
      transparent: true, depthWrite: false, depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uStrength:   { value: 0.0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
    });
    const flashMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), flashMat);
    flashMesh.frustumCulled = false;
    flashMesh.renderOrder = 999;
    scene.add(flashMesh);

    // ============================================
    // Nebulas — 6 clouds spread across deep Z for real 3D parallax
    // Pink + purple + blue-violet only
    // ============================================
    const NEBULA_COUNT = 6;
    const nebulaGroup = new THREE.Group();
    scene.add(nebulaGroup);

    const PALETTE = [
      new THREE.Color('#22D3EE'), // cyan
      new THREE.Color('#0EA5E9'), // sky cyan
      new THREE.Color('#06B6D4'), // deep cyan
      new THREE.Color('#3B82F6'), // electric blue
      new THREE.Color('#1D4ED8'), // royal blue
      new THREE.Color('#1E3A8A'), // navy
      new THREE.Color('#0F172A'), // deep navy
      new THREE.Color('#A5F3FC'), // pale cyan
      new THREE.Color('#93C5FD'), // pale blue
    ];

    const nebulaVS = `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `;
    const nebulaFS = `
      varying vec2 vUv;
      uniform vec3  uColorA;
      uniform vec3  uColorB;
      uniform float uTime;
      uniform float uSeed;
      uniform float uStrength;
      ${GLSL_NOISE}

      void main() {
        vec2 uv = (vUv - 0.5) * 2.0;
        float r = length(uv);

        vec2 p = uv * 1.2 + vec2(uSeed * 13.37, uSeed * 7.11);
        float t = uTime * 0.04;

        vec2 q = vec2(
          fbm(p + vec2(t, -t * 0.7)),
          fbm(p + vec2(-t * 0.6, t * 0.9) + 5.2)
        );
        float n = fbm(p + q * 0.9);

        float edge = smoothstep(1.0, 0.0, r);
        edge = pow(edge, 1.6);

        float mixT = 0.5 + 0.5 * sin(uTime * 0.06 + uSeed * 2.3);
        vec3 tint = mix(uColorA, uColorB, mixT);

        float alpha = edge * mix(0.15, 1.1, n) * uStrength;
        float hot = smoothstep(0.55, 0.85, n) * 0.3;

        gl_FragColor = vec4(tint + hot, alpha * 0.22);
      }
    `;

    for (let i = 0; i < NEBULA_COUNT; i++) {
      const colorA = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      let colorB = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      if (colorB === colorA) colorB = PALETTE[(PALETTE.indexOf(colorA) + 2) % PALETTE.length];

      // Spread Z from -30 (close/big) to -200 (distant/small) for real parallax
      const zLayer = -30 - Math.random() * 170;
      // Scale proportional to depth so they all look plausibly "the right size"
      const sizeFactor = 1 + Math.abs(zLayer) / 60;
      const size = (70 + Math.random() * 100) * sizeFactor * 0.4;

      const geo = new THREE.PlaneGeometry(size, size);
      const mat = new THREE.ShaderMaterial({
        vertexShader: nebulaVS,
        fragmentShader: nebulaFS,
        uniforms: {
          uColorA:   { value: colorA.clone() },
          uColorB:   { value: colorB.clone() },
          uTime:     { value: Math.random() * 100 },
          uSeed:     { value: Math.random() * 100 },
          uStrength: { value: 0.0 },
        },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geo, mat);

      const rad = 40 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2;
      const ph = (Math.random() - 0.5) * 0.6;
      mesh.position.set(Math.cos(th) * rad, Math.sin(ph) * rad * 0.4, zLayer);
      mesh.userData.drift = {
        vx: (Math.random() - 0.5) * 0.025,
        vy: (Math.random() - 0.5) * 0.018,
        vr: (Math.random() - 0.5) * 0.04,
      };
      nebulaGroup.add(mesh);
    }

    // ============================================
    // Intro state
    // ============================================
    let introStart = 0;
    let introActive = false;
    let explosionProgress = 0;
    let isExploding = false;
    let debrisLife = 1; // 1 = gone, 0 = alive

    // Broadcast intro milestones for the page content to delay its reveal
    function broadcast(type) {
      window.dispatchEvent(new CustomEvent('supernova:' + type));
    }

    window.__SN_TWEAKS = window.__SN_TWEAKS || { replay: 0, disableEvent: false };
    let lastReplay = 0;

    function snapStarsToFinal() {
      const pos = starGeo.attributes.position.array;
      for (let i = 0; i < STAR_COUNT; i++) {
        pos[i * 3]     = finalPositions[i * 3];
        pos[i * 3 + 1] = finalPositions[i * 3 + 1];
        pos[i * 3 + 2] = finalPositions[i * 3 + 2];
      }
      starGeo.attributes.position.needsUpdate = true;
      explosionProgress = 1;
    }
    function resetStarsToOrigin() {
      const pos = starGeo.attributes.position.array;
      for (let i = 0; i < STAR_COUNT; i++) {
        pos[i * 3] = 0; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = 0;
      }
      starGeo.attributes.position.needsUpdate = true;
      explosionProgress = 0;
    }
    function startIntro() {
      introStart = performance.now() / 1000;
      introActive = true;
      isExploding = false;
      debrisLife = 1;
      resetStarsToOrigin();
      coreMat.uniforms.uSize.value = 0.0;
      coreMat.uniforms.uIntensity.value = 0.0;
      beamMat.uniforms.uIntensity.value = 0.0;
      beamMat.uniforms.uPull.value      = 0.0;
      shells.forEach((s) => {
        s.mesh.scale.set(0.001, 0.001, 0.001);
        s.mesh.material.uniforms.uIntensity.value = 0.0;
      });
      flashMat.uniforms.uStrength.value = 0.0;
      debrisMat.uniforms.uProgress.value = 0.0;
      debrisMat.uniforms.uLife.value = 1.0;
      broadcast('start');
    }
    function skipIntro() {
      introActive = false;
      snapStarsToFinal();
      coreMat.uniforms.uIntensity.value = 0.0;
      beamMat.uniforms.uIntensity.value = 0.0;
      beamMat.uniforms.uPull.value      = 0.0;
      shells.forEach((s) => {
        s.mesh.scale.set(0.001, 0.001, 0.001);
        s.mesh.material.uniforms.uIntensity.value = 0.0;
      });
      flashMat.uniforms.uStrength.value = 0.0;
      debrisMat.uniforms.uLife.value = 1.0;
      broadcast('detonate');
      broadcast('complete');
    }

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.__SN_TWEAKS.disableEvent || reducedMotion) skipIntro();
    else startIntro();

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      flashMat.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    });

    const mouse = { x: 0, y: 0 };
    window.addEventListener('pointermove', (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    });

    const scroll = { y: 0, n: 0, nSmooth: 0 };
    function updateScroll() {
      scroll.y = window.scrollY || 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scroll.n = Math.min(1, scroll.y / max);
    }
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeInCubic  = (t) => t * t * t;
    const easeOutExpo  = (t) => 1 - Math.pow(2, -10 * Math.max(0, Math.min(1, t)));
    const pow01        = (t) => Math.pow(Math.max(0, Math.min(1, t)), 0.7);

    const clock = new THREE.Clock();
    let running = true;
    let didBroadcastDetonate = false;
    let didBroadcastComplete = false;
    // Camera dolly during explosion — pushes camera forward then settles back
    let dollyExplosion = 0;

    function frame() {
      if (!running) return;
      const now = performance.now();
      const elapsed = clock.getElapsedTime();

      if (window.__SN_TWEAKS.replay !== lastReplay) {
        lastReplay = window.__SN_TWEAKS.replay;
        didBroadcastDetonate = false;
        didBroadcastComplete = false;
        startIntro();
      }

      const dt = frame._lastNow ? (now - frame._lastNow) / 1000 : 0.016;
      frame._lastNow = now;

      if (introActive) {
        const t = (now / 1000) - introStart;

        // --- CONDENSE / ABSORB PHASE ---
        // Beams stream into the core completely, finishing before the hold.
        // Core grows to a modest peak size (smaller than before).
        if (t < T_ABSORB) {
          const ct = Math.min(1, t / T_ABSORB);

          // Core grows to a smaller peak (was 0.90 → now 0.55)
          const grow = easeOutCubic(ct);
          coreMat.uniforms.uSize.value      = 0.08 + grow * 0.47;       // 0.08 → 0.55
          coreMat.uniforms.uIntensity.value = 0.4 + easeInCubic(ct) * 1.6;

          // Beams: fully complete their journey before this phase ends.
          // Ramp in 0.05 → 0.30, plateau, then fade out 0.70 → 0.95.
          const sIn  = Math.max(0, Math.min(1, (ct - 0.05) / 0.25));
          const ramp = sIn * sIn * (3 - 2 * sIn);
          const sOut = Math.max(0, Math.min(1, (ct - 0.70) / 0.25));
          const fade = 1.0 - (sOut * sOut * (3 - 2 * sOut));
          beamMat.uniforms.uIntensity.value = ramp * fade;
          beamMat.uniforms.uPull.value      = easeInCubic(ct);
          beamMat.uniforms.uTime.value      = (now / 1000) - introStart;
        } else if (t < T_DETONATE) {
          // --- HOLD PHASE ---
          // Core sits at peak, charged. Tiny breathing pulse so it isn't dead-still.
          const ht = (t - T_ABSORB) / (T_DETONATE - T_ABSORB);
          const breathe = 1.0 + Math.sin(ht * Math.PI * 2.0) * 0.03;
          coreMat.uniforms.uSize.value      = 0.55 * breathe;
          coreMat.uniforms.uIntensity.value = 2.0 + Math.sin(ht * Math.PI * 4.0) * 0.15;
          beamMat.uniforms.uIntensity.value = 0.0;
        } else {
          // --- POST-DETONATION: core flashes larger briefly then fades ---
          const ft = Math.min(1, (t - T_DETONATE) / 1.0);
          coreMat.uniforms.uSize.value      = 0.08 + easeOutCubic(ft) * 0.9;
          coreMat.uniforms.uIntensity.value = (1.0 - ft) * 2.4;
          beamMat.uniforms.uIntensity.value = 0.0;
          beamMat.uniforms.uPull.value      = 1.0;
          beamMat.uniforms.uTime.value      = (now / 1000) - introStart;
        }

        if (t >= T_DETONATE) {
          const st = Math.min(1, (t - T_DETONATE) / (T_SHOCK_END - T_DETONATE));

          // --- EXPAND THE 3 NESTED SHELLS ---
          // Each shell has its own delay so they launch in sequence
          shells.forEach((s) => {
            const sp = Math.max(0, (st - s.delay) / (1.0 - s.delay));
            const spe = easeOutCubic(Math.min(1, sp));
            const scale = 0.01 + spe * s.maxR;
            s.mesh.scale.set(scale, scale, scale);
            // Fade each shell as it reaches its max radius
            const life = pow01(1.0 - Math.min(1, sp));
            s.mesh.material.uniforms.uIntensity.value = life * 1.1;
            s.mesh.material.uniforms.uTime.value = elapsed;
          });

          // Debris burst — drive shader progress over same window
          debrisMat.uniforms.uProgress.value = easeOutCubic(st);
          debrisLife = Math.max(0, Math.min(1, (st - 0.65) / 0.35));
          debrisMat.uniforms.uLife.value = debrisLife;

          // Camera dolly — push toward origin then ease back
          const bell = Math.sin(st * Math.PI);
          dollyExplosion = bell * -5.5;

          if (!didBroadcastDetonate) { didBroadcastDetonate = true; broadcast('detonate'); }
        }

        if (t >= T_DETONATE && t < T_FLASH_FADE) {
          const ft = (t - T_DETONATE) / (T_FLASH_FADE - T_DETONATE);
          flashMat.uniforms.uStrength.value = easeOutCubic(ft) * 1.0;
        } else if (t >= T_FLASH_FADE) {
          const ft = Math.min(1, (t - T_FLASH_FADE) / (T_COMPLETE - T_FLASH_FADE));
          flashMat.uniforms.uStrength.value = Math.max(0, 1.0 - easeInCubic(ft));
        }

        if (t >= T_DETONATE) isExploding = true;

        if (t >= T_COMPLETE) {
          introActive = false;
          shells.forEach((s) => { s.mesh.material.uniforms.uIntensity.value = 0.0; });
          flashMat.uniforms.uStrength.value = 0.0;
          coreMat.uniforms.uIntensity.value = 0.0;
          beamMat.uniforms.uIntensity.value = 0.0;
          debrisMat.uniforms.uLife.value = 1.0;
          dollyExplosion = 0;
          if (!didBroadcastComplete) { didBroadcastComplete = true; broadcast('complete'); }
        }
      }

      if (isExploding && explosionProgress < 1) {
        explosionProgress = Math.min(1, explosionProgress + dt * EXPLOSION_SPEED_FACTOR);
        const eased = easeOutCubic(explosionProgress);
        const pos = starGeo.attributes.position.array;
        for (let i = 0; i < STAR_COUNT; i++) {
          pos[i * 3]     = finalPositions[i * 3]     * eased;
          pos[i * 3 + 1] = finalPositions[i * 3 + 1] * eased;
          pos[i * 3 + 2] = finalPositions[i * 3 + 2] * eased;
        }
        starGeo.attributes.position.needsUpdate = true;
      }

      points.rotation.y = elapsed * AMBIENT_ROTATION_SPEED;

      const introDone = explosionProgress >= 1 && !introActive;
      const targetNebulaStrength = introDone ? 1.0 : 0.0;
      nebulaGroup.children.forEach((m) => {
        const u = m.material.uniforms;
        u.uTime.value = elapsed;
        u.uStrength.value += (targetNebulaStrength - u.uStrength.value) * Math.min(1, dt * 0.35);
        m.position.x += m.userData.drift.vx * dt * 4;
        m.position.y += m.userData.drift.vy * dt * 4;
        m.rotation.z += m.userData.drift.vr * dt;
        m.lookAt(camera.position);
      });

      scroll.nSmooth += (scroll.n - scroll.nSmooth) * Math.min(1, dt * 3.0);
      const dollyZ = scroll.nSmooth * 14;
      const scrollRotY = scroll.nSmooth * 0.35;
      const scrollRotX = scroll.nSmooth * -0.12;
      points.rotation.y = elapsed * AMBIENT_ROTATION_SPEED + scrollRotY;
      nebulaGroup.rotation.y = scrollRotY * 0.6;
      nebulaGroup.rotation.x = scrollRotX;

      const camTargetX = mouse.x * MOUSE_POS_X;
      const camTargetY = mouse.y * MOUSE_POS_Y - scroll.nSmooth * 2.2;
      const camTargetZ = CAMERA_POSITION_Z + dollyZ + dollyExplosion;
      // Faster lerp during explosion so dolly feels punchy
      const camLerp = introActive ? 0.12 : CAM_FOLLOW;
      camera.position.x += (camTargetX - camera.position.x) * CAM_FOLLOW;
      camera.position.y += (camTargetY - camera.position.y) * CAM_FOLLOW;
      camera.position.z += (camTargetZ - camera.position.z) * camLerp;
      const targetRotX = mouse.y * MOUSE_ROT_X;
      const targetRotY = mouse.x * MOUSE_ROT_Y;
      camera.rotation.x += (targetRotX - camera.rotation.x) * ROT_LERP;
      camera.rotation.y += (targetRotY - camera.rotation.y) * ROT_LERP;
      camera.lookAt(0, 0, 0);

      coreMesh.lookAt(camera.position);
      // Shells are REAL 3D — don't billboard them, keep their tilt.

      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    frame();

    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) frame();
    });
  }

  init();
})();
