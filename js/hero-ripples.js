/**
 * Hero water ripples — adapted from
 * https://github.com/Whynotmetoo/water-ripples (CPU height-field + WebGL refraction).
 */
(function (global) {
    'use strict';

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function initOriaHeroRipples(options) {
        const hero = options.hero;
        const canvas = options.canvas;
        const wash = options.wash;
        if (!hero || !canvas || prefersReducedMotion()) return null;

        const gl = canvas.getContext('webgl', {
            alpha: true,
            antialias: false,
            premultipliedAlpha: false,
            preserveDrawingBuffer: false,
        }) || canvas.getContext('experimental-webgl', {
            alpha: true,
            antialias: false,
        });
        if (!gl) return null;

        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        const NX = 160;
        const params = { ripple: 1, light: 0.85, refr: 0.42 };

        let W = 0;
        let H = 0;
        let NY = 160;
        let u;
        let uPrev;
        let simBytes;
        let photoW = 1;
        let photoH = 1;
        let glReady = false;
        let running = false;
        let visible = true;
        let rafId = 0;
        let lastT = performance.now();
        let breathT = 0;
        let lastMx = -1;
        let lastMy = -1;
        let coverFx = 1;
        let coverFy = 1;

        function allocSim() {
            NY = Math.max(90, Math.min(288, Math.round((NX * H) / Math.max(W, 1))));
            u = new Float32Array(NX * NY);
            uPrev = new Float32Array(NX * NY);
            simBytes = new Uint8Array(NX * NY);
            simBytes.fill(128);
        }

        function drop(gx, gy, radius, strength) {
            const r2 = radius * radius;
            const x0 = Math.max(1, Math.floor(gx - radius));
            const x1 = Math.min(NX - 2, Math.ceil(gx + radius));
            const y0 = Math.max(1, Math.floor(gy - radius));
            const y1 = Math.min(NY - 2, Math.ceil(gy + radius));
            for (let y = y0; y <= y1; y += 1) {
                for (let x = x0; x <= x1; x += 1) {
                    const dx = x - gx;
                    const dy = y - gy;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < r2) {
                        const k = Math.cos((Math.sqrt(d2) / radius) * Math.PI * 0.5);
                        u[y * NX + x] += strength * k * k;
                    }
                }
            }
        }

        function stepWater() {
            const damp = 0.979;
            for (let y = 1; y < NY - 1; y += 1) {
                const row = y * NX;
                for (let x = 1; x < NX - 1; x += 1) {
                    const i = row + x;
                    const v = (u[i - 1] + u[i + 1] + u[i - NX] + u[i + NX]) * 0.5 - uPrev[i];
                    uPrev[i] = v * damp;
                }
            }
            const t = u;
            u = uPrev;
            uPrev = t;
        }

        function packSim() {
            for (let i = 0; i < u.length; i += 1) {
                const v = 128 + u[i] * 26;
                simBytes[i] = v < 1 ? 1 : v > 254 ? 254 : v;
            }
        }

        const VSH = `
attribute vec2 aPos;
varying vec2 vUv;
void main(){
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

        const FSH = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uPhoto;
uniform sampler2D uSim;
uniform vec2 uTexel;
uniform vec2 uFrac;
uniform float uRefr;
uniform float uLight;
uniform float uTime;

float h(vec2 p){ return texture2D(uSim, p).r - 0.5019608; }

void main(){
  vec2 e = uTexel;
  float hl = h(vUv - vec2(e.x, 0.0));
  float hr = h(vUv + vec2(e.x, 0.0));
  float ht = h(vUv - vec2(0.0, e.y));
  float hb = h(vUv + vec2(0.0, e.y));
  vec2 grad = vec2(hr - hl, hb - ht);

  vec2 puv = (vUv - 0.5) * uFrac + 0.5;
  puv += grad * uRefr;
  puv = clamp(puv, 0.002, 0.998);
  vec3 col = texture2D(uPhoto, puv).rgb;

  float light = (grad.x + grad.y) * 2.4;
  col += light * vec3(1.0, 0.98, 0.92);

  float spec = max(0.0, light - 0.045) * 5.5;
  col += spec * vec3(1.0, 1.0, 0.96);

  float band = sin(dot(vUv, vec2(1.3, 1.0)) * 2.6 - uTime * 0.2);
  col += min(0.2, smoothstep(0.78, 1.0, band) * 0.065 * uLight);

  vec2 sc = vec2(0.5 + 0.22 * cos(uTime * 0.07), 0.36 + 0.18 * sin(uTime * 0.09));
  float pool = 1.0 - smoothstep(0.0, 0.55, distance(vUv * vec2(1.0, 1.35), sc * vec2(1.0, 1.35)));
  col += pool * 0.055 * uLight;

  gl_FragColor = vec4(col, 1.0);
}`;

        function makeShader(type, src) {
            const s = gl.createShader(type);
            gl.shaderSource(s, src);
            gl.compileShader(s);
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.warn('Hero ripples shader:', gl.getShaderInfoLog(s));
                return null;
            }
            return s;
        }

        let prog;
        let texPhoto;
        let texSim;
        const uni = {};

        function initGL() {
            const vs = makeShader(gl.VERTEX_SHADER, VSH);
            const fs = makeShader(gl.FRAGMENT_SHADER, FSH);
            if (!vs || !fs) return false;
            prog = gl.createProgram();
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                console.warn('Hero ripples program:', gl.getProgramInfoLog(prog));
                return false;
            }
            gl.useProgram(prog);

            const buf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
            const loc = gl.getAttribLocation(prog, 'aPos');
            gl.enableVertexAttribArray(loc);
            gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

            ['uPhoto', 'uSim', 'uTexel', 'uFrac', 'uRefr', 'uLight', 'uTime'].forEach((n) => {
                uni[n] = gl.getUniformLocation(prog, n);
            });
            gl.uniform1i(uni.uPhoto, 0);
            gl.uniform1i(uni.uSim, 1);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
            return true;
        }

        function setupPhotoTexture(img) {
            photoW = img.naturalWidth || img.width;
            photoH = img.naturalHeight || img.height;
            texPhoto = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texPhoto);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        function setupSimTexture() {
            if (texSim) gl.deleteTexture(texSim);
            texSim = gl.createTexture();
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texSim);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, NX, NY, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, simBytes);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        function updateCover() {
            const s = Math.max(W / photoW, H / photoH);
            coverFx = W / (s * photoW);
            coverFy = H / (s * photoH);
            gl.uniform2f(uni.uFrac, coverFx, coverFy);
            gl.uniform2f(uni.uTexel, 1 / NX, 1 / NY);
        }

        function touchWater(px, py, big) {
            const gx = (px / W) * NX;
            const gy = (py / H) * NY;
            if (big) drop(gx, gy, 6, 2.2 * params.ripple);
            else drop(gx, gy, 2.4, 0.45 * params.ripple);
        }

        function toLocal(clientX, clientY) {
            const rect = canvas.getBoundingClientRect();
            return {
                x: clientX - rect.left,
                y: clientY - rect.top,
            };
        }

        function onPointerMove(e) {
            const p = toLocal(e.clientX, e.clientY);
            if (lastMx >= 0) {
                const dist = Math.hypot(p.x - lastMx, p.y - lastMy);
                if (dist > 2) touchWater(p.x, p.y, false);
            }
            lastMx = p.x;
            lastMy = p.y;
            play();
        }

        function onPointerDown(e) {
            const p = toLocal(e.clientX, e.clientY);
            touchWater(p.x, p.y, true);
            lastMx = p.x;
            lastMy = p.y;
            play();
        }

        function onPointerLeave() {
            lastMx = -1;
            lastMy = -1;
        }

        function layout() {
            const rect = canvas.getBoundingClientRect();
            W = Math.max(1, Math.floor(rect.width));
            H = Math.max(1, Math.floor(rect.height));
            canvas.width = Math.floor(W * DPR);
            canvas.height = Math.floor(H * DPR);
            allocSim();
            if (glReady) {
                gl.viewport(0, 0, canvas.width, canvas.height);
                setupSimTexture();
                updateCover();
            }
        }

        function play() {
            if (running || !glReady || !visible) return;
            running = true;
            lastT = performance.now();
            rafId = requestAnimationFrame(frame);
        }

        function pause() {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
            rafId = 0;
        }

        function frame(now) {
            if (!running) return;
            const dt = Math.min(0.05, (now - lastT) / 1000);
            lastT = now;
            const t = now / 1000;

            breathT -= dt;
            if (breathT <= 0) {
                breathT = 1.2 + Math.random() * 2.2;
                drop(2 + Math.random() * (NX - 4), 2 + Math.random() * (NY - 4), 2, 0.1);
            }

            stepWater();
            packSim();

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, texSim);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NX, NY, gl.LUMINANCE, gl.UNSIGNED_BYTE, simBytes);
            gl.uniform1f(uni.uRefr, params.refr);
            gl.uniform1f(uni.uLight, params.light);
            gl.uniform1f(uni.uTime, t);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            rafId = requestAnimationFrame(frame);
        }

        const image = new Image();
        image.decoding = 'async';
        image.crossOrigin = 'anonymous';
        image.src = wash?.currentSrc || wash?.src || 'assets/art/art-hero-wash.jpg';
        image.onload = () => {
            layout();
            if (!initGL()) return;
            gl.viewport(0, 0, canvas.width, canvas.height);
            setupPhotoTexture(image);
            setupSimTexture();
            updateCover();
            glReady = true;
            hero.classList.add('has-liquid-hero');
            // Seed a gentle ambient drop so the surface feels alive
            drop(NX * 0.5, NY * 0.45, 3, 0.2);
            play();
        };
        if (image.complete && image.naturalWidth) {
            image.onload();
        }

        window.addEventListener('resize', layout, { passive: true });
        hero.addEventListener('pointermove', onPointerMove, { passive: true });
        hero.addEventListener('pointerdown', onPointerDown, { passive: true });
        hero.addEventListener('pointerleave', onPointerLeave, { passive: true });

        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    visible = entry.isIntersecting;
                    if (visible) play();
                    else pause();
                });
            }, { threshold: 0.05 });
            io.observe(hero);
        }

        return { play, pause, layout };
    }

    global.initOriaHeroRipples = initOriaHeroRipples;
})(typeof window !== 'undefined' ? window : globalThis);
