import * as THREE from '../../vendor/three.module.js';

/**
 * Cel-Shaded / Toon Shading & Material Helpers
 * Provides stepped cartoon gradient ramps, clean inverted-hull outlines,
 * and atmospheric sky and water shaders.
 */

let cachedRampTexture = null;

export function getToonRampTexture() {
  if (cachedRampTexture) return cachedRampTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  // 4 discrete stepped tone bands for cozy cel-shading
  // [0..64]: shadow (0.50), [65..140]: mid (0.75), [141..220]: base (0.92), [221..255]: highlight (1.0)
  const imgData = ctx.createImageData(256, 1);
  const data = imgData.data;

  for (let x = 0; x < 256; x++) {
    let val;
    if (x < 65) {
      val = 130; // warm soft shadow
    } else if (x < 145) {
      val = 195; // mid tone
    } else if (x < 225) {
      val = 238; // base lit surface
    } else {
      val = 255; // sharp toon highlight
    }

    const idx = x * 4;
    data[idx] = val;
    data[idx + 1] = val;
    data[idx + 2] = val;
    data[idx + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;

  cachedRampTexture = texture;
  return cachedRampTexture;
}

export function createToonMaterial(color, options = {}) {
  const ramp = getToonRampTexture();
  const mat = new THREE.MeshToonMaterial({
    color: new THREE.Color(color),
    gradientMap: ramp,
    wireframe: options.wireframe || false,
    transparent: options.transparent || false,
    opacity: options.opacity !== undefined ? options.opacity : 1.0,
    side: options.side || THREE.FrontSide,
    ...options
  });
  return mat;
}

/**
 * Creates an inverted-hull outline mesh for clean anime / cartoon contours
 */
export function createOutlineMesh(geometry, outlineColor = 0x24283b, thickness = 0.035) {
  const outlineMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      uniform float uThickness;
      void main() {
        vec3 normalDir = normalize(normal);
        vec3 newPosition = position + normalDir * uThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
      }
    `,
    uniforms: {
      uThickness: { value: thickness },
      uColor: { value: new THREE.Color(outlineColor) }
    },
    side: THREE.BackSide,
    depthWrite: true
  });

  const mesh = new THREE.Mesh(geometry, outlineMaterial);
  return mesh;
}

/**
 * Creates a cozy procedural gradient sky dome
 */
export function createGradientSkyDome(zenithColor, horizonColor, groundColor, radius = 450) {
  const geo = new THREE.SphereGeometry(radius, 32, 24);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(zenithColor) },
      bottomColor: { value: new THREE.Color(horizonColor) },
      groundColor: { value: new THREE.Color(groundColor) },
      offset: { value: 15.0 },
      exponent: { value: 0.6 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 groundColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
        vec3 sky = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
        vec3 col = mix(groundColor, sky, clamp(h + 0.1, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false
  });

  return new THREE.Mesh(geo, mat);
}

/**
 * Creates stylized toon water with rippling geometric waves
 */
export function createToonWater(width, length, waterColor = 0x55b4d4, foamColor = 0xe4f7fc) {
  const geo = new THREE.PlaneGeometry(width, length, 48, 48);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWaterColor: { value: new THREE.Color(waterColor) },
      uFoamColor: { value: new THREE.Color(foamColor) }
    },
    vertexShader: `
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wave1 = sin(pos.x * 0.15 + uTime * 1.8) * cos(pos.z * 0.12 + uTime * 1.5) * 0.22;
        float wave2 = sin(pos.x * 0.35 - uTime * 2.2 + pos.z * 0.25) * 0.12;
        pos.y += wave1 + wave2;
        vWave = (wave1 + wave2);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uWaterColor;
      uniform vec3 uFoamColor;
      uniform float uTime;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        float crest = step(0.18, vWave);
        vec3 col = mix(uWaterColor, uFoamColor, crest * 0.65);
        gl_FragColor = vec4(col, 0.88);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.update = (dt) => {
    mat.uniforms.uTime.value += dt;
  };
  return mesh;
}
