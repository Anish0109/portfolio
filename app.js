// The 3D scene: sky, headlights, frames, signs and spark trails.
// You normally don't need to edit this file. The texts and videos are in content.js.
(() => {
const HDRI = 'sky.jpg';
const T3 = window.THREE, $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches, FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const TAU = Math.PI * 2, lerp = (a, b, t) => a + (b - a) * t, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const UI = "'Archivo', 'Arial Narrow', Arial, sans-serif";
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const num = n => WORD[n] || String(n), cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

// ---------- texts and videos: read from content.js (window.PORTFOLIO)
const CFG = window.PORTFOLIO || {};
const SLOTS = (CFG.videos || []).filter(v => v && v.file).map((v, i) => ({id: String(v.id || `video${i + 1}`), src: v.file, name: v.name || `Video ${i + 1}`, short: v.short || v.name || `video ${i + 1}`, sell: v.sell || 'Made in Blender.'}));
const fillCount = s => String(s).replace(/\{Count\}/g, cap(num(SLOTS.length))).replace(/\{count\}/g, num(SLOTS.length));
const TRAILER = (CFG.trailer || []).map(fillCount);
if (!TRAILER.length) TRAILER.push('Click to explore my car animations.');
const SIGNS = (CFG.signs || []).filter(s => s && s.head).map(s => ({head: fillCount(s.head), line: fillCount(s.line || 'The nearest video is {dir}.'), to: s.to || 'near'}));

$('#trailer-all').textContent = TRAILER.join(' ');

const stage = $('#stage'), cv = $('#gl'), startEl = $('#start'), fillEl = $('.start .fill');
if (!FINE) { document.querySelectorAll('[data-l1]').forEach(e => { e.textContent = 'Tap to'; }); $('#start-hint').textContent = 'Tap anywhere to begin'; startEl.setAttribute('aria-label', startEl.getAttribute('aria-label').replace('Click', 'Tap')); }
// if the 3D scene can't run, show the animations as plain players so nobody leaves without seeing them
const plain = msg => { startEl.hidden = true; $('#intro').hidden = true; stage.insertAdjacentHTML('beforeend', `<div class="no3d"><p>${msg}</p><div class="plain">${SLOTS.map(s => `<figure><video src="${esc(s.src)}" controls playsinline preload="metadata"></video><figcaption>${esc(s.name)}</figcaption></figure>`).join('')}</div></div>`); };
if (!SLOTS.length) { startEl.hidden = true; stage.insertAdjacentHTML('beforeend', '<div class="no3d"><p>No videos are listed yet. Add them to content.js.</p></div>'); return; }
if (!T3) { plain('The 3D scene could not load, so here are my animations as plain videos.'); return; }
let R;
try { R = new T3.WebGLRenderer({canvas: cv, antialias: true, powerPreference: 'high-performance'}); }
catch (err) { plain('This browser could not start the 3D scene, so here are my animations as plain videos.'); return; }
R.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75)); R.outputEncoding = T3.sRGBEncoding; R.toneMapping = T3.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
const scene = new T3.Scene();
const cam = new T3.PerspectiveCamera(RM ? 52 : 64, 16 / 9, .1, 1200); scene.add(cam);
const V3 = T3.Vector3, ORIGIN = new V3();
const G1 = new T3.Group(); scene.add(G1);
const shared = {uTime: {value: 0}};
const linTex = t => { t.minFilter = T3.LinearFilter; t.generateMipmaps = false; return t; };

// ---------- sky: your HDRI, darkened almost to black, plus faint stars so turning can be felt
const skyTex = new T3.Texture(); skyTex.encoding = T3.sRGBEncoding; skyTex.wrapS = T3.RepeatWrapping; skyTex.repeat.x = -1;
const skyImg = new Image(); skyImg.onload = () => { skyTex.image = skyImg; skyTex.needsUpdate = true; }; skyImg.src = HDRI;
G1.add(new T3.Mesh(new T3.SphereGeometry(500, 64, 32), new T3.MeshBasicMaterial({map: skyTex, side: T3.BackSide, depthWrite: false, color: 0x1d1f24})));
function starField(n, seed, size, op, colorful) {
  const r = rng(seed), a = [], c = [];
  for (let i = 0; i < n; i++) {
    const u = r() * TAU, y = r() * 2 - 1, s = Math.sqrt(1 - y * y), k = colorful ? r() : 1, b = .55 + r() * .45;
    a.push(Math.cos(u) * s * 480, y * 480, Math.sin(u) * s * 480);
    c.push(...(k < .1 ? [1, .78, .55] : k < .3 ? [.7, .82, 1] : [.88, .92, 1]).map(v => v * b));
  }
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(a, 3)); g.setAttribute('color', new T3.Float32BufferAttribute(c, 3));
  return new T3.Points(g, new T3.PointsMaterial({vertexColors: true, size, sizeAttenuation: false, transparent: true, opacity: op, depthWrite: false}));
}
G1.add(starField(1800, 9, 1.1, .42, false));

// ---------- shaders
const NOISE = `
  float hsh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float nse(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hsh(i), hsh(i + vec2(1.0, 0.0)), f.x), mix(hsh(i + vec2(0.0, 1.0)), hsh(i + vec2(1.0, 1.0)), f.x), f.y); }`;
const PANEL_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// the fade: a focus pull. The frame arrives blurred, dim and colourless, comes into focus from the centre out while the
// colour fringes close up, gets a soft lift of exposure and one glint as it lands, and leaves the same way in reverse.
const FOCUS_FS = `
  uniform sampler2D uMap; uniform float uV, uIn, uTime, uAspect, uDither, uEdge;
  varying vec2 vUv;
  ${NOISE}
  vec3 tapC(vec2 uv, vec2 ca){ return vec3(texture2D(uMap, uv + ca).r, texture2D(uMap, uv).g, texture2D(uMap, uv - ca).b); }
  void main(){
    float v = uV;
    vec2 c = vUv - 0.5;
    float r = length(c * vec2(uAspect, 1.0)) / (0.5 * length(vec2(uAspect, 1.0)));
    float f = smoothstep(r * 0.5, r * 0.5 + 0.5, v);
    vec2 ca = c * (1.0 - f) * 0.045;
    vec3 col;
    if (v > 0.995) col = texture2D(uMap, vUv).rgb;
    else {
      float b = (1.0 - f) * 0.055; col = vec3(0.0);
      for (int i = 0; i < 10; i++) {
        float a = float(i) * 2.39996, rr = sqrt((float(i) + 0.5) / 10.0) * b;
        col += tapC(vUv + vec2(cos(a) / uAspect, sin(a)) * rr, ca);
      }
      col /= 10.0;
    }
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, 0.3 + 0.7 * f);
    float land = uIn * smoothstep(0.55, 0.85, v) * (1.0 - smoothstep(0.86, 1.0, v));
    col = col * (mix(0.3, 1.0, smoothstep(0.0, 0.75, v)) + land * 0.32) + vec3(1.0, 0.86, 0.66) * land * 0.05;
    float sw = (vUv.x * uAspect * 0.6 + vUv.y * 0.4) / (uAspect * 0.6 + 0.4);
    col += vec3(1.0, 0.94, 0.82) * uIn * (1.0 - smoothstep(0.0, 0.06, abs(sw - (v - 0.62) * 2.7))) * smoothstep(0.62, 0.7, v) * (1.0 - smoothstep(0.97, 1.0, v)) * 0.2;
    float e = min(min(vUv.x, 1.0 - vUv.x) * uAspect, min(vUv.y, 1.0 - vUv.y));
    float g = mix(0.5, hsh(floor(vUv * vec2(170.0 * uAspect, 170.0)) + floor(uTime * 7.0) * 0.137), uDither);
    float band = mix(0.3, uEdge, v), m = smoothstep(0.0, band, e - (g - 0.5) * band * 1.2);
    gl_FragColor = vec4(col, smoothstep(0.0, 0.6, v) * m);
  }`;
// the border: particles that fly in from the dark and settle on the frame's edge as it fades in, and drift off as it fades out
const PT_VS = `
  attribute vec2 aUv; attribute vec2 aDir; attribute float aSeed;
  uniform float uW, uH, uSize, uPix, uV, uPing, uTime;
  varying vec2 vUv; varying float vA, vP;
  void main(){
    float life = fract(uTime * (0.1 + 0.22 * fract(aSeed * 7.31)) + aSeed);
    float k = 1.0 - max(uV, uPing * 0.85);
    float sc = k * k * (1.6 + 2.6 * fract(aSeed * 3.71));
    vec3 p = vec3((aUv.x - 0.5) * uW, (aUv.y - 0.5) * uH, 0.0);
    p.xy += aDir * ((0.22 + 0.62 * fract(aSeed * 3.17)) * life + sc);
    float sw = uTime * 0.5 + aSeed * 40.0;
    p.xy += vec2(cos(sw), sin(sw)) * sc * 0.4;
    p.x += sin(aSeed * 91.0 + uTime * 1.3) * 0.05 * life;
    p.y += 0.22 * life * fract(aSeed * 5.7);
    p.z += (fract(aSeed * 13.1) - 0.5) * (0.6 * life + sc * 1.2);
    float st = fract(aSeed * 1.93) * 0.5;
    vA = max(smoothstep(st, st + 0.5, uV), uPing * 0.55) * (1.0 - life) * (1.0 - life);
    vP = uPing * (1.0 - uV); vUv = aUv;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * uPix * (1.0 - life * 0.45) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const PT_FS = `
  uniform sampler2D uMap; varying vec2 vUv; varying float vA, vP;
  void main(){
    float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard;
    vec3 col = mix(texture2D(uMap, vUv).rgb * 1.5 + 0.05, vec3(1.0, 0.72, 0.4), clamp(vP, 0.0, 1.0));
    float a = vA * (1.0 - r * 2.0);
    gl_FragColor = vec4(col * a, a);
  }`;
// floating text: the same focus pull, on the whole sign at once
const NOTE_FS = `
  uniform sampler2D uMap; uniform float uV, uAsp;
  varying vec2 vUv;
  void main(){
    float b = (1.0 - uV) * 0.1;
    vec4 acc = vec4(0.0);
    for (int i = 0; i < 12; i++) {
      float a = float(i) * 2.39996, r = sqrt((float(i) + 0.5) / 12.0) * b;
      vec4 t = texture2D(uMap, vUv + vec2(cos(a) / uAsp, sin(a)) * r);
      acc += vec4(t.rgb * t.a, t.a);
    }
    acc /= 12.0;
    gl_FragColor = vec4(acc.rgb / max(acc.a, 0.001) * (0.8 + 0.25 * uV), acc.a * smoothstep(0.0, 0.75, uV));
  }`;
const TRAIL_VS = `attribute float aA; uniform float uPix; varying float vA; void main(){ vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = (0.06 + 0.12 * aA) * uPix / -mv.z; gl_Position = projectionMatrix * mv; }`;
const TRAIL_FS = `varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); if (r > 0.5) discard; float a = vA * (1.0 - r * 2.0); gl_FragColor = vec4(vec3(1.0, 0.8, 0.52) * a, a); }`;
// ---------- the frames, scattered over the whole sphere, each tilted its own way
const NPT = 3000;
const dirs = (() => {        // the first frame waits straight ahead; the rest spread round the sphere, then push apart
  const r = rng(2025), out = [new V3(0, 0, -1)], N = Math.max(SLOTS.length, 10), G = Math.PI * (3 - Math.sqrt(5));
  for (let i = 1; i < N; i++) { const y = lerp(.8, -.8, (i - .5) / (N - 1)) + (r() - .5) * .12, a = i * G + r() * .5, s = Math.sqrt(1 - y * y); let d = new V3(Math.cos(a) * s, y, Math.sin(a) * s); if (d.angleTo(out[0]) < 1) d.set(-d.x, d.y, -d.z); out.push(d); }
  const tmp = new V3();
  for (let it = 0; it < 60; it++) for (let i = 1; i < N; i++) {
    for (let j = 0; j < N; j++) { if (i === j) continue; const ang = out[i].angleTo(out[j]); if (ang < 1.1) { tmp.subVectors(out[i], out[j]).normalize(); out[i].addScaledVector(tmp, (1.1 - ang) * .25).normalize(); } }
    if (Math.abs(out[i].y) > .86) { out[i].y = Math.sign(out[i].y) * .86; out[i].normalize(); }
  }
  const order = out.slice(1).map((d, k) => [r(), d]).sort((a, b) => a[0] - b[0]).map(v => v[1]);
  return [out[0], ...order];
})();
const panels = (() => {
  const r = rng(77), kinds = ['roll', 'yaw', 'pitch', 'level'], shift = Math.floor(r() * 4);
  return SLOTS.map((sl, i) => {
    const kind = i === 0 ? 'level' : kinds[(i - 1 + shift) % 4], dist = i === 0 ? 8.4 : 8.5 + r() * 3.2, rw = i === 0 ? -1 : r(), W = i === 0 ? 9.2 : 8 + rw * 2, small = i === 0 ? 6.4 / 9.2 : (5.4 + rw * 1.8) / W, H = W * 9 / 16;
    const vid = document.createElement('video'); vid.muted = true; vid.loop = true; vid.playsInline = true; vid.setAttribute('playsinline', ''); vid.crossOrigin = 'anonymous'; vid.preload = 'auto'; vid.src = sl.src;
    const tex = linTex(new T3.VideoTexture(vid));
    const U = {uMap: {value: tex}, uV: {value: 0}, uIn: {value: 0}, uTime: shared.uTime, uAspect: {value: W / H}, uDither: {value: 1}, uEdge: {value: .09}};
    const mesh = new T3.Mesh(new T3.PlaneGeometry(W, H), new T3.ShaderMaterial({uniforms: U, vertexShader: PANEL_VS, fragmentShader: FOCUS_FS, transparent: true, depthWrite: false, side: T3.DoubleSide}));
    mesh.position.copy(dirs[i]).multiplyScalar(dist); mesh.lookAt(0, 0, 0);
    const sign = r() < .5 ? -1 : 1, deg = d => d * Math.PI / 180;
    if (kind === 'roll') mesh.rotateZ(sign * deg(16 + r() * 20));
    else if (kind === 'yaw') mesh.rotateY(sign * deg(24 + r() * 18));
    else if (kind === 'pitch') mesh.rotateX(sign * deg(22 + r() * 16));
    mesh.renderOrder = 3; mesh.userData.i = i; mesh.visible = false; mesh.scale.setScalar(small); G1.add(mesh);
    const pr = rng(100 + i), a = {aUv: [], aDir: [], aSeed: [], position: []}, per = 2 * W / H + 2;
    for (let k = 0; k < NPT; k++) {
      const s = pr() * per, inset = pr() * .03, tj = (pr() - .5) * .7; let u, w, dx, dy;
      if (s < W / H) { u = s / (W / H); w = 1 - inset; dx = tj; dy = 1; }
      else if (s < 2 * W / H) { u = (s - W / H) / (W / H); w = inset; dx = tj; dy = -1; }
      else if (s < 2 * W / H + 1) { u = inset * H / W; w = s - 2 * W / H; dx = -1; dy = tj; }
      else { u = 1 - inset * H / W; w = s - 2 * W / H - 1; dx = 1; dy = tj; }
      a.aUv.push(u, w); a.aDir.push(dx, dy); a.aSeed.push(pr()); a.position.push(0, 0, 0);
    }
    const pg = new T3.BufferGeometry(); pg.setAttribute('position', new T3.Float32BufferAttribute(a.position, 3)); pg.setAttribute('aUv', new T3.Float32BufferAttribute(a.aUv, 2)); pg.setAttribute('aDir', new T3.Float32BufferAttribute(a.aDir, 2)); pg.setAttribute('aSeed', new T3.Float32BufferAttribute(a.aSeed, 1));
    const ptU = Object.assign({}, U, {uW: {value: W}, uH: {value: H}, uSize: {value: .05}, uPix: {value: 400}, uPing: {value: 0}});
    const pts = new T3.Points(pg, new T3.ShaderMaterial({uniforms: ptU, vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, depthWrite: false, blending: T3.AdditiveBlending}));
    pts.frustumCulled = false; pts.renderOrder = 4; mesh.add(pts);
    const p = {sl, i, kind, dir: dirs[i].clone(), dist, mesh, U, ptU, tex, video: vid, src: sl.src, name: sl.name, short: sl.short, sell: sl.sell, has: true, v: 0, u: 0, inS: 0, hold: 0, ping: 0, inModal: false, small, g: 0, gu: 0, said: false};
    watchVideo(p); return p;
  });
})();
function watchVideo(p) {         // show a frame from the first second once it loads; if the file is missing, say so on the frame
  const v = p.video;
  v.addEventListener('loadeddata', () => { if (v.paused) v.currentTime = Math.min(1, (v.duration || 3) / 3); }, {once: true});
  v.addEventListener('error', () => {
    const c = mk(1280, 720), x = c.getContext('2d'); x.fillStyle = '#140e07'; x.fillRect(0, 0, 1280, 720);
    x.fillStyle = '#F6B25A'; x.font = `800 64px ${UI}`; x.fillText('Video not found', 80, 300);
    x.fillStyle = '#D9D1C4'; x.font = `500 34px ${UI}`; x.fillText(p.src, 80, 380); x.fillText('Check the file name in content.js', 80, 436);
    p.U.uMap.value = linTex(new T3.CanvasTexture(c)); p.video = null; console.warn('Video not found:', p.src);
  }, {once: true});
}
const meshes = panels.map(p => p.mesh);

// ---------- floating signs: they come into focus when your lights reach them, and the hints point at real videos
const notes = [], noteHits = [];
const yawOf = d => Math.atan2(d.x, -d.z), pitchOf = d => Math.asin(clamp(d.y, -1, 1));
function relDir(from, to) {      // where "to" sits for someone reading a sign at "from", in plain words
  let dy = yawOf(to) - yawOf(from); dy = Math.atan2(Math.sin(dy), Math.cos(dy));
  const dp = pitchOf(to) - pitchOf(from), ay = Math.abs(dy) * 180 / Math.PI, ap = dp * 180 / Math.PI, ang = Math.atan2(-dp, dy);
  const h = ay > 145 ? 'right behind you' : ay < 14 ? '' : `about ${Math.max(20, Math.round(ay / 10) * 10)}° to your ${dy > 0 ? 'right' : 'left'}`;
  const v = Math.abs(ap) < 12 ? '' : ap > 38 ? 'high up' : ap > 0 ? 'a little higher' : ap < -38 ? 'far below' : 'a little lower';
  if (h) return {text: v ? `${h}, ${v}` : h, ang};
  return {text: {'high up': 'high above this sign', 'a little higher': 'just above this sign', 'far below': 'far below this sign'}[v] || 'just below this sign', ang};
}
function drawArrow(x, cx, cy, ang) { x.save(); x.translate(cx, cy); x.rotate(ang); x.strokeStyle = '#F6B25A'; x.lineWidth = 6; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(-24, 0); x.lineTo(22, 0); x.moveTo(6, -15); x.lineTo(23, 0); x.lineTo(6, 15); x.stroke(); x.restore(); }
function wrapText(x, text, maxW) { const out = []; let cur = ''; text.split(' ').forEach(w => { const t = cur ? cur + ' ' + w : w; if (cur && x.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; }
function noteCanvas(head, line, ang) {
  const c = mk(16, 16); let x = c.getContext('2d');
  const fH = () => { x.font = `800 84px ${UI}`; if ('fontStretch' in x) x.fontStretch = 'condensed'; };
  const fL = () => { x.font = `500 46px ${UI}`; if ('fontStretch' in x) x.fontStretch = 'normal'; };
  const ar = ang == null ? 0 : 84;
  fH(); const wh = x.measureText(head).width; let lines = [], wl = 0;
  if (line) { fL(); lines = wrapText(x, line, Math.max(wh, 980) - ar); lines.forEach(l => { wl = Math.max(wl, x.measureText(l).width + ar); }); }
  c.width = Math.ceil(Math.max(wh, wl)) + 60; c.height = line ? 150 + lines.length * 60 : 150; x = c.getContext('2d'); x.textBaseline = 'middle';
  fH(); x.fillStyle = '#FFF1DA'; x.fillText(head, 30, 66);
  x.fillStyle = 'rgba(243,154,30,.95)'; x.fillRect(30, 120, 64, 5);
  if (line) { fL(); x.fillStyle = '#D9D1C4'; lines.forEach((l, k) => x.fillText(l, 30 + ar, 174 + k * 60)); if (ang != null) drawArrow(x, 60, 174, ang); }
  return c;
}
function setNoteText(n, head, line, ang) {
  const key = head + '|' + line + '|' + (ang == null ? '' : ang.toFixed(2)); if (key === n.text) return; n.text = key;
  const c = noteCanvas(head, line, ang), tex = new T3.CanvasTexture(c); tex.anisotropy = 4;
  if (n.U.uMap.value) n.U.uMap.value.dispose(); n.U.uMap.value = tex;
  const wm = c.width * .006, hm = c.height * .006; n.U.uAsp.value = wm / hm;
  n.mesh.geometry.dispose(); n.mesh.geometry = new T3.PlaneGeometry(wm, hm);
  n.hit.geometry.dispose(); n.hit.geometry = new T3.PlaneGeometry(wm + 1.6, hm + 1.4);
}
function makeNote(o) {
  const n = {dir: o.dir.clone(), dist: o.dist, sign: o.sign, v: 0, u: 0, hold: 0, lastTrail: -99, text: '', tg: null};
  n.U = {uMap: {value: null}, uV: {value: 0}, uAsp: {value: 1}};
  n.mesh = new T3.Mesh(new T3.PlaneGeometry(1, 1), new T3.ShaderMaterial({uniforms: n.U, vertexShader: PANEL_VS, fragmentShader: NOTE_FS, transparent: true, depthWrite: false, side: T3.DoubleSide}));
  n.hit = new T3.Mesh(new T3.PlaneGeometry(1, 1), new T3.MeshBasicMaterial({side: T3.DoubleSide})); n.hit.visible = false; n.hit.userData.note = n;
  n.mesh.renderOrder = 2; n.mesh.visible = false;
  n.mesh.position.copy(n.dir).multiplyScalar(n.dist); n.mesh.lookAt(0, 0, 0); n.hit.position.copy(n.mesh.position); n.hit.quaternion.copy(n.mesh.quaternion); G1.add(n.mesh, n.hit);
  setNoteText(n, o.head, '', null);
  noteHits.push(n.hit); notes.push(n); return n;
}
function hintFor(n) {            // which video a sign points at: its own, or the nearest one still hiding
  const un = panels.filter(p => p.has), sg = n.sign;
  if (!un.length) return {tg: null, line: 'Thanks for watching.'};
  let p = sg.to === 'near' || sg.to === 'far' ? null : panels.find(q => q.sl.id === sg.to);
  if (!p || !p.has) p = un.reduce((a, b) => (n.dir.angleTo(a.dir) <= n.dir.angleTo(b.dir)) === (sg.to !== 'far') ? a : b);
  const rd = relDir(n.dir, p.dir);
  return {tg: {kind: 'panel', p, dir: p.dir, dist: p.dist, name: p.short}, line: sg.line.replace('{dir}', rd.text).replace('{name}', p.short), ang: rd.ang};
}
function refreshNotes() { notes.forEach(n => { const h = hintFor(n); n.tg = h.tg; setNoteText(n, n.sign.head, h.line, h.ang); }); }
function buildNotes() {          // signs go where the frames left the most room
  const C = [], M = 520, G = Math.PI * (3 - Math.sqrt(5)), chosen = [];
  for (let i = 0; i < M; i++) { const y = 1 - (i + .5) / M * 2; if (Math.abs(y) > .82) continue; const s = Math.sqrt(1 - y * y), a = i * G; C.push(new V3(Math.cos(a) * s, y, Math.sin(a) * s)); }
  SIGNS.forEach(sign => {
    let best = C[0], bs = -1;
    C.forEach(c => { let m = 9; panels.forEach(p => { m = Math.min(m, c.angleTo(p.dir)); }); chosen.forEach(d => { m = Math.min(m, c.angleTo(d) * .85); }); if (m > bs) { bs = m; best = c; } });
    chosen.push(best); makeNote({head: sign.head, dir: best, dist: 13.5, sign});
  });
  refreshNotes();
}

// ---------- the spark trail: read a sign and sparks fly from it to the video it points at
const trail = (() => {
  const N = 150, g = new T3.BufferGeometry(), r = rng(404);
  g.setAttribute('position', new T3.Float32BufferAttribute(new Float32Array(N * 3), 3)); g.setAttribute('aA', new T3.Float32BufferAttribute(new Float32Array(N), 1));
  const m = new T3.Points(g, new T3.ShaderMaterial({uniforms: {uPix: {value: 400}}, vertexShader: TRAIL_VS, fragmentShader: TRAIL_FS, transparent: true, depthWrite: false, blending: T3.AdditiveBlending}));
  m.frustumCulled = false; m.renderOrder = 6; m.visible = false; G1.add(m);
  return {N, g, m, a: new V3(), axis: new V3(), ang: 0, ra: 13.5, rb: 10, t: -1, dur: 2, tg: null, pinged: false, jit: Array.from({length: N * 3}, () => r() - .5)};
})();
function launchTrail(n) {
  const tg = n.tg; if (!tg) return;
  trail.a.copy(n.dir).normalize(); trail.axis.crossVectors(trail.a, tg.dir); const s = trail.axis.length();
  if (s < 1e-4) trail.axis.set(0, 1, 0); else trail.axis.divideScalar(s);
  trail.ang = trail.a.angleTo(tg.dir); trail.ra = n.dist; trail.rb = tg.dist; trail.tg = tg; trail.t = 0; trail.pinged = false;
  trail.dur = RM ? .4 : clamp(trail.ang * .9, 1.1, 2.8); trail.m.visible = true;
}

// ---------- the headlights: two visible beams from just below your eyes, with dust in the light
const beamMat = () => new T3.ShaderMaterial({
  uniforms: {uI: {value: 0}}, transparent: true, depthWrite: false, blending: T3.AdditiveBlending, side: T3.DoubleSide,
  vertexShader: `varying float vZ; void main(){ vZ = position.z; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform float uI; varying float vZ; void main(){ float a = uI * 0.075 * smoothstep(0.02, 0.28, vZ) * (1.0 - vZ * 0.75); gl_FragColor = vec4(vec3(1.0, 0.9, 0.74) * a, a); }`,
});
const coneGeo = new T3.ConeGeometry(1, 1, 32, 1, true); coneGeo.translate(0, -.5, 0); coneGeo.rotateX(-Math.PI / 2);
const heads = [-1, 1].map(side => { const cone = new T3.Mesh(coneGeo, beamMat()); cone.renderOrder = 5; scene.add(cone); return {side, cone, from: new V3(), to: new V3()}; });
const dust = (() => {
  const n = 260, g = new T3.BufferGeometry(), r = rng(77), seeds = Array.from({length: n}, () => [r(), r(), r(), r() < .5 ? 0 : 1]);
  g.setAttribute('position', new T3.Float32BufferAttribute(new Float32Array(n * 3), 3));
  const dot = mk(32, 32), dx = dot.getContext('2d'), dg = dx.createRadialGradient(16, 16, 0, 16, 16, 16); dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(1, 'rgba(255,255,255,0)'); dx.fillStyle = dg; dx.fillRect(0, 0, 32, 32);
  const p = new T3.Points(g, new T3.PointsMaterial({color: 0xfff0d6, map: new T3.CanvasTexture(dot), size: .03, transparent: true, opacity: 0, depthWrite: false, blending: T3.AdditiveBlending}));
  p.frustumCulled = false; scene.add(p); return {p, g, seeds};
})();

// ---------- state and input
let phase = 'intro', exploreT = 0, clock = 0;
const st = {mx: .5, my: .5, inside: false, aim: false, kx: 0, ky: 0, hover: -1, drag: null, vy: 0, vp: 0};
const ray = new T3.Raycaster(), ndc = new T3.Vector2(), reticle = $('#reticle'), modal = $('#modal'), modalMedia = $('#modal-media');
const overlayOpen = () => !modal.hidden;
const setPointer = e => { const r = stage.getBoundingClientRect(); st.mx = clamp((e.clientX - r.left) / r.width, 0, 1); st.my = clamp((e.clientY - r.top) / r.height, 0, 1); reticle.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`; };
const blocked = e => phase !== 'explore' || !!e.target.closest('.modal, .start');
stage.addEventListener('pointerenter', e => { st.inside = true; setPointer(e); if (phase === 'explore') st.aim = true; });
stage.addEventListener('pointerleave', () => { st.inside = false; });
const qa = new T3.Quaternion(), qb = new T3.Quaternion(), AX = new V3(1, 0, 0), AY = new V3(0, 1, 0);
stage.addEventListener('pointermove', e => {
  setPointer(e);
  if (phase === 'explore') st.aim = true;
  if (st.drag && e.pointerType !== 'mouse' && phase === 'explore') {
    const dx = (e.clientX - st.drag.x) / stage.clientWidth, dy = (e.clientY - st.drag.y) / stage.clientHeight;
    cam.quaternion.copy(st.drag.q).multiply(qa.setFromAxisAngle(AY, dx * 2.4)).multiply(qb.setFromAxisAngle(AX, dy * 2));
  }
});
stage.addEventListener('pointerdown', e => { if (blocked(e)) return; setPointer(e); st.aim = true; if (e.pointerType !== 'mouse') st.drag = {x: e.clientX, y: e.clientY, t: performance.now(), q: cam.quaternion.clone()}; });
stage.addEventListener('pointerup', e => {
  if (blocked(e)) { st.drag = null; return; }
  const tap = !st.drag || (Math.hypot(e.clientX - st.drag.x, e.clientY - st.drag.y) < 10 && performance.now() - st.drag.t < 450); st.drag = null;
  if (tap) act();
});
function act() {                 // a click or Enter opens the video your lights are on
  if (st.hover >= 0 && panels[st.hover].v > .4) { openModal(st.hover); return true; }
  return false;
}
stage.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if (!modal.hidden) closeModal(); return; }
  if (e.target !== stage && (e.key === 'Enter' || e.key === ' ')) return;
  if (phase === 'intro') { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); begin(); } return; }
  if (phase !== 'explore' || overlayOpen()) return;
  const k = {ArrowLeft: ['kx', -1], ArrowRight: ['kx', 1], ArrowUp: ['ky', 1], ArrowDown: ['ky', -1]}[e.key];
  if (k) { st[k[0]] = k[1]; e.preventDefault(); return; }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!act()) { st.mx = .5; st.my = .5; st.aim = true; } }
});
stage.addEventListener('keyup', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') st.kx = 0; if (e.key === 'ArrowUp' || e.key === 'ArrowDown') st.ky = 0; });

// ---------- the first screen: a few lines about you, then you drive through the headline into the dark
const trEl = $('#trailer'); let trI = 0;
trEl.textContent = TRAILER[0]; setTimeout(() => trEl.classList.remove('out'), 350);
const trTimer = setInterval(() => {
  if (phase !== 'intro') { clearInterval(trTimer); return; }
  trEl.classList.add('out');
  setTimeout(() => { trI = (trI + 1) % TRAILER.length; trEl.textContent = TRAILER[trI]; trEl.classList.remove('out'); }, RM ? 60 : 900);
}, 3800);
function begin() {
  if (phase !== 'intro') return;
  phase = 'explore'; exploreT = 0; st.aim = true;
  startEl.classList.add('go'); $('#intro').classList.add('gone'); stage.focus({preventScroll: true});
  setTimeout(() => { startEl.hidden = true; $('#intro').hidden = true; }, RM ? 400 : 1300);
  setTimeout(() => { stage.classList.add('live'); }, RM ? 100 : 900);
  setTimeout(() => whisper(`${cap(num(total()))} animations are parked out here. Sweep your headlights to find them.`, true), RM ? 200 : 1500);
}
startEl.addEventListener('click', begin);

// ---------- the full-size viewer, with sound
function openModal(i) {
  const p = panels[i]; if (!p) return;
  $('#modal-t').textContent = p.name; modal.dataset.kind = 'video'; modal.dataset.i = i;
  modalMedia.innerHTML = '';
  if (p.video) {                 // the same video moves into the viewer and starts over with sound; it is already loaded, so it plays at once
    const v = p.video; p.inModal = true; v.controls = true; v.muted = false; v.currentTime = 0; modalMedia.append(v); v.play().catch(() => {});
  } else modalMedia.innerHTML = `<video src="${esc(p.src)}" controls autoplay playsinline></video>`;
  modal.hidden = false; stage.classList.add('ov'); $('#modal-x').focus();
}
function closeModal() {
  const p = panels[+modal.dataset.i];
  if (p && p.inModal) { const v = p.video; v.controls = false; v.muted = true; p.inModal = false; }   // the browser pauses it as it leaves the viewer; the frame loop starts it again
  modal.hidden = true; modalMedia.innerHTML = ''; stage.classList.remove('ov'); stage.focus({preventScroll: true}); }
$('#modal-x').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// ---------- words: status line and whispers
const statusEl = $('#status'), statusT = $('#status-t'); let statusKey = '';
function status(html, on, key = html) { if (key === statusKey) return; statusKey = key; statusT.innerHTML = html; statusEl.classList.toggle('on', !!on); }
const wEl = $('#whisper'); let wLast = -99, wText = '', wTimer = 0;
function whisper(text, force) {
  if (text === wText || (!force && clock - wLast < 3.2)) return;
  wText = text; wLast = clock; wEl.classList.add('out'); clearTimeout(wTimer);
  wTimer = setTimeout(() => { wEl.textContent = text; wEl.classList.remove('out'); }, RM ? 0 : 450);
}
const total = () => panels.filter(p => p.has).length;

// ---------- resize and the frame loop
function resize() {
  const w = stage.clientWidth, h = stage.clientHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  const y = R.getDrawingBufferSize(new T3.Vector2()).y * .5;
  panels.forEach(p => { p.ptU.uPix.value = y; }); trail.m.material.uniforms.uPix.value = y;
}
new ResizeObserver(resize).observe(stage); resize();

const edgeEls = {l: $('#edgeL'), r: $('#edgeR'), t: $('#edgeT'), b: $('#edgeB')}, wheel = $('#wheel');
const fwd = new V3(), right = new V3(), up = new V3(), tmp = new V3(), tmp2 = new V3(), WUP = new V3(0, 1, 0), lm = new T3.Matrix4(), qt = new T3.Quaternion(), qi = new T3.Quaternion();
const curve = a => Math.pow(Math.max(0, (a - .17) / .33), 1.6);
const smooth2 = (o, tg, dt, rIn, rOut) => { const k = 1 - Math.exp(-dt * (tg ? rIn : rOut)); o.u += (tg - o.u) * k; o.v += (o.u - o.v) * k; if (!tg && o.v < .001) o.v = o.u = 0; if (tg && o.v > .999) o.v = 1; };
let last = performance.now(), keysT = 0;
function frame(now) {
  const dt = clamp((now - last) / 1000, 0, .05); last = now; clock += dt;
  shared.uTime.value = RM ? 4 : clock;
  if (phase === 'explore') exploreT += dt;

  // the headline: the two headlight pools follow the mouse, or sweep by themselves until it arrives
  if (phase === 'intro') {
    const w = stage.clientWidth, h = stage.clientHeight, sr = stage.getBoundingClientRect(), fr = fillEl.getBoundingClientRect();
    let x = st.inside && FINE ? st.mx * w : w * (.5 + .3 * Math.sin(clock * .55)), y = st.inside && FINE ? st.my * h : h * (.5 + .1 * Math.sin(clock * 1.1 + 1));
    x -= fr.left - sr.left; y -= fr.top - sr.top; const off = Math.min(90, w * .06), rw = clamp(w * .17, 80, 240);
    startEl.style.setProperty('--rw', `${rw.toFixed(0)}px`); startEl.style.setProperty('--rh', `${(rw * .7).toFixed(0)}px`);
    startEl.style.setProperty('--lx', `${x - off}px`); startEl.style.setProperty('--ly', `${y}px`); startEl.style.setProperty('--rx', `${x + off}px`); startEl.style.setProperty('--ry', `${y}px`);
    if (!RM) cam.quaternion.multiply(qa.setFromAxisAngle(AY, -.02 * dt));
  } else if (phase === 'explore' && !RM && cam.fov > 52.01) { cam.fov = lerp(cam.fov, 52, 1 - Math.exp(-dt * 2.2)); cam.updateProjectionMatrix(); }

  // turning: any edge steers, the middle is calm; you can loop right over the top
  let wy = 0, wp = 0;
  const steer = phase === 'explore' && !overlayOpen();
  if (steer && st.inside && FINE) { const dx = st.mx - .5, dy = st.my - .5; wy = -Math.sign(dx) * curve(Math.abs(dx)) * 1.45; wp = -Math.sign(dy) * curve(Math.abs(dy)) * 1.15; }
  if (steer && st.kx) wy = -st.kx * 1.1;
  if (steer && st.ky) wp = st.ky * .9;
  st.vy = lerp(st.vy, wy, 1 - Math.exp(-dt * 5)); st.vp = lerp(st.vp, wp, 1 - Math.exp(-dt * 5));
  cam.quaternion.multiply(qa.setFromAxisAngle(AY, st.vy * dt)).multiply(qb.setFromAxisAngle(AX, st.vp * dt));
  fwd.set(0, 0, -1).applyQuaternion(cam.quaternion);
  if (Math.abs(wy) + Math.abs(wp) < .001 && !st.drag && Math.abs(fwd.y) < .9) { lm.lookAt(ORIGIN, fwd, WUP); qt.setFromRotationMatrix(lm); cam.quaternion.slerp(qt, 1 - Math.exp(-dt * 1.3)); }
  cam.quaternion.normalize(); cam.updateMatrixWorld();
  edgeEls.l.style.opacity = clamp(st.vy / 1.45, 0, 1).toFixed(2); edgeEls.r.style.opacity = clamp(-st.vy / 1.45, 0, 1).toFixed(2);
  edgeEls.t.style.opacity = clamp(st.vp / 1.15, 0, 1).toFixed(2); edgeEls.b.style.opacity = clamp(-st.vp / 1.15, 0, 1).toFixed(2);
  wheel.style.transform = `translateY(${(-st.vp * 4).toFixed(1)}px) rotate(${(-st.vy / 1.45 * 70).toFixed(1)}deg)`;

  // aiming: the ray from the mouse finds whatever is under the headlights
  const live = phase === 'explore' && exploreT > .9 && !overlayOpen();
  const ax = st.aim ? st.mx : .5, ay = st.aim ? st.my : .5;
  ndc.set(ax * 2 - 1, -(ay * 2 - 1)); ray.setFromCamera(ndc, cam);
  st.hover = -1; let hovNote = null, aimPoint = null;
  if (live) {
    const h = ray.intersectObjects(meshes, false)[0]; if (h) { st.hover = h.object.userData.i; aimPoint = h.point; }
    const nh = ray.intersectObjects(noteHits, false)[0]; if (nh) hovNote = nh.object.userData.note;
  }
  if (!aimPoint) aimPoint = ray.ray.at(12, tmp2);
  right.set(1, 0, 0).applyQuaternion(cam.quaternion); up.set(0, 1, 0).applyQuaternion(cam.quaternion);
  const flick = phase === 'intro' ? 0 : RM ? 1 : exploreT < .35 ? 0 : exploreT < 1.35 ? ([.25, .95, .1, 1].find((v, k) => exploreT < .35 + (k + 1) * .25) ?? 1) : 1;
  heads.forEach(h => {
    h.from.copy(cam.position).addScaledVector(right, h.side * .6).addScaledVector(up, -.5);
    h.to.copy(aimPoint).addScaledVector(right, h.side * .36);
    const len = h.from.distanceTo(h.to), rad = len * Math.tan(.2);
    h.cone.position.copy(h.from); h.cone.lookAt(h.to); h.cone.scale.set(rad, rad, len); h.cone.material.uniforms.uI.value = flick;
  });
  const dp = dust.g.attributes.position.array;
  dust.seeds.forEach((s, k) => {
    const h = heads[s[3]], v = .18 + .82 * (RM ? s[0] : (s[0] + clock * .05 * (.5 + s[1])) % 1), len = h.from.distanceTo(h.to);
    tmp.copy(h.from).lerp(h.to, v); const spread = v * len * Math.tan(.2) * s[2];
    tmp.addScaledVector(right, Math.cos(s[1] * 40) * spread).addScaledVector(up, Math.sin(s[1] * 40) * spread);
    dp[k * 3] = tmp.x; dp[k * 3 + 1] = tmp.y; dp[k * 3 + 2] = tmp.z;
  });
  dust.g.attributes.position.needsUpdate = true; dust.p.material.opacity = .75 * flick;

  // signs: they come into focus while your lights are on them, and a hint sends sparks to its video
  notes.forEach(n => {
    const on = live && n === hovNote;
    if (on) n.hold = .7; else n.hold -= dt;
    smooth2(n, (on || n.hold > 0) ? 1 : 0, dt, 5, 4);
    n.U.uV.value = n.v; n.mesh.visible = n.v > .002;
    if (n.sign && n.v > .7 && trail.t < 0 && clock - n.lastTrail > 6) { n.lastTrail = clock; launchTrail(n); }
  });

  // frames: the light finds a small frame, it focuses in, then grows big enough to watch; move away and it shrinks, then fades
  let lit = null;
  panels.forEach(p => {
    const isHit = st.hover === p.i;
    if (isHit) p.hold = .35; else p.hold -= dt;
    const tg = live && (isHit || p.hold > 0) ? 1 : 0;
    smooth2(p, tg || p.g > .3 ? 1 : 0, dt, 6, 7);
    const gt = tg && p.v > .55 ? 1 : 0, kg = 1 - Math.exp(-dt * (gt ? 4.5 : 6));
    p.gu += (gt - p.gu) * kg; p.g += (p.gu - p.g) * kg; if (RM) p.g = p.gu = gt;
    p.inS = lerp(p.inS, tg, 1 - Math.exp(-dt * 8)); p.ping = Math.max(0, p.ping - dt / 1.6);
    p.U.uV.value = p.v; p.U.uIn.value = p.inS; p.ptU.uPing.value = p.ping;
    p.mesh.visible = p.v > .002 || p.ping > .01;
    p.mesh.scale.setScalar((p.small + (1 - p.small) * p.g) * (RM ? 1 : 1 + (1 - p.v) * .06));
    if (!RM) p.mesh.position.copy(p.dir).multiplyScalar(p.dist + (1 - p.v) * .8);
    const awake = tg === 1 || p.v > .02;
    if (p.video && !p.inModal) { if (awake && p.video.paused) p.video.play().catch(() => {}); else if (!awake && !p.video.paused) p.video.pause(); }
    if (p.has && p.g > .8 && !p.said) { p.said = true; whisper(`${p.name}. ${p.sell}`); }
    if (isHit) lit = p;
  });

  // status line
  if (phase === 'explore') {
    if (lit) status(`<b>${esc(lit.name)}</b> <em>${lit.v > .4 ? 'Click to watch with sound' : 'Hold the light here'}</em>`, lit.v > .4, lit.sl.id + (lit.v > .4));
    else if (live) status('Sweep the headlights to find a video', false);
  }

  // the spark trail flies along the sky from a sign to its video, then makes that frame's edge flicker
  if (trail.t >= 0) {
    trail.t += dt; const k = clamp(trail.t / trail.dur, 0, 1), head = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const fade = trail.t > trail.dur ? Math.max(0, 1 - (trail.t - trail.dur) / .9) : 1;
    const P = trail.g.attributes.position.array, A = trail.g.attributes.aA.array;
    for (let i = 0; i < trail.N; i++) {
      const u = head - i / trail.N * .3;
      if (u < 0) { A[i] = 0; continue; }
      tmp.copy(trail.a).applyAxisAngle(trail.axis, trail.ang * u).multiplyScalar(lerp(trail.ra, trail.rb, u));
      const w = .1 + i / trail.N * .7;
      P[i * 3] = tmp.x + trail.jit[i * 3] * w + Math.sin(clock * 7 + i) * .03; P[i * 3 + 1] = tmp.y + trail.jit[i * 3 + 1] * w; P[i * 3 + 2] = tmp.z + trail.jit[i * 3 + 2] * w;
      A[i] = (1 - i / trail.N) * fade;
    }
    trail.g.attributes.position.needsUpdate = true; trail.g.attributes.aA.needsUpdate = true;
    if (k >= 1 && !trail.pinged) { trail.pinged = true; const tg = trail.tg; if (tg.kind === 'panel') { tg.p.ping = 1; whisper(`The sparks stopped at the ${tg.name}. Point your lights there.`); } }
    if (fade <= 0) { trail.t = -1; trail.m.visible = false; }
  }

  if (live) { keysT += st.inside ? dt : 0; if (keysT > 10) $('#keys').style.opacity = '.4'; }
  R.render(scene, cam);
  requestAnimationFrame(frame);
}
(document.fonts && document.fonts.load ? Promise.all([document.fonts.load(`800 84px Archivo`), document.fonts.load(`600 13px Archivo`), document.fonts.load(`500 46px Archivo`)]).catch(() => {}) : Promise.resolve()).then(() => {
  buildNotes();
});
requestAnimationFrame(frame);
})();
