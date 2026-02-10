(function () {
  const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

  const fragmentShader = `
precision highp float;
varying vec2 vUv;

uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uMouseForce;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uAutoMix;

float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.55;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = vUv;
  vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  vec2 p = (uv - 0.5) * aspect;

  vec2 m = (uMouse - 0.5) * aspect;
  float d = length(p - m);
  float influence = exp(-d * (8.0 - min(uMouseForce * 0.12, 5.0)));
  vec2 flow = vec2(
    sin(uTime * 0.45 + p.y * 7.2),
    cos(uTime * 0.36 + p.x * 6.2)
  ) * (0.03 + influence * 0.13);

  vec2 q = p * 3.1 + flow * 2.0;
  float n1 = fbm(q + uTime * 0.07);
  float n2 = fbm(q * 1.3 - uTime * 0.05 + vec2(1.7, 3.1));
  float n = mix(n1, n2, 0.5);

  // thin droplet-like highlights instead of large cloud blobs
  float droplets = smoothstep(0.63, 0.79, n) - smoothstep(0.79, 0.9, n);
  float micro = smoothstep(0.74, 0.88, fbm(q * 1.9 + vec2(6.2, 1.3)));
  float l0 = smoothstep(0.28, 0.74, n);
  float l1 = smoothstep(0.44, 0.95, n + 0.08 * sin(uTime * 0.22 + q.x));

  vec3 c = vec3(1.0);
  c = mix(c, uColor0, l0 * 0.08);
  c = mix(c, uColor1, l1 * 0.09);
  c += uColor2 * droplets * 0.22;
  c += uColor1 * micro * 0.08;
  c = mix(c, vec3(1.0), 0.72);
  float alpha = 0.58 + droplets * 0.12;

  gl_FragColor = vec4(c, alpha);
}
`;

  function hexToVec3(THREE, hex) {
    const c = new THREE.Color(hex || "#d6e9ff");
    return new THREE.Vector3(c.r, c.g, c.b);
  }

  function initLiquidEther(opts = {}) {
    const THREE = window.THREE;
    if (!THREE) return false;
    const ambient = document.querySelector(".ambient-bg");
    if (!ambient) return false;
    if (ambient.__liquidCleanup) ambient.__liquidCleanup();

    const mount = document.createElement("div");
    mount.className = "liquid-ether-container";
    ambient.prepend(mount);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (_) {
      if (mount.parentNode) mount.parentNode.removeChild(mount);
      return false;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.offsetWidth || window.innerWidth, mount.offsetHeight || window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(mount.offsetWidth || window.innerWidth, mount.offsetHeight || window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseForce: { value: opts.mouseForce ?? 20 },
      uColor0: { value: hexToVec3(THREE, opts.color0 || "#b9dbff") },
      uColor1: { value: hexToVec3(THREE, opts.color1 || "#d9edff") },
      uColor2: { value: hexToVec3(THREE, opts.color2 || "#c6e3ff") },
      uAutoMix: { value: 1 }
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let raf = 0;
    let isVisible = true;
    let lastUserMove = 0;
    const autoResumeDelay = opts.autoResumeDelay ?? 3000;
    const autoDemo = opts.autoDemo !== false;
    const autoSpeed = opts.autoSpeed ?? 0.5;
    const autoIntensity = opts.autoIntensity ?? 2.2;
    const start = performance.now();

    const onMove = (e) => {
      const rect = mount.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      uniforms.uMouse.value.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height
      );
      lastUserMove = performance.now();
    };

    window.addEventListener("mousemove", onMove, { passive: true });

    const io = new IntersectionObserver(([entry]) => {
      isVisible = !!entry && entry.isIntersecting;
    }, { threshold: 0 });
    io.observe(mount);

    const onResize = () => {
      const w = mount.offsetWidth || window.innerWidth;
      const h = mount.offsetHeight || window.innerHeight;
      renderer.setSize(w, h);
      uniforms.uResolution.value.set(w, h);
    };
    window.addEventListener("resize", onResize);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;
      const t = (performance.now() - start) * 0.001;
      uniforms.uTime.value = t;

      if (autoDemo && performance.now() - lastUserMove > autoResumeDelay) {
        uniforms.uMouse.value.set(
          0.5 + Math.sin(t * autoSpeed) * 0.18 * autoIntensity * 0.25,
          0.5 + Math.cos(t * autoSpeed * 0.8) * 0.16 * autoIntensity * 0.25
        );
      }
      renderer.render(scene, camera);
    };
    animate();

    ambient.__liquidCleanup = () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      io.disconnect();
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.parentNode) mount.parentNode.removeChild(mount);
      delete ambient.__liquidCleanup;
    };

    return true;
  }

  window.initLiquidEther = initLiquidEther;
})();
