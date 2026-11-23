/**
 * Grid + particle field, matched to the logged-out movinartists.com hero video
 * (Wix asset ab5424_58e1e43924b44e03b9fbedb0cd031b65, 566×720, 9.825s, 120fps).
 *
 * Reference frames: ref/video-frames/ and ref/crops/
 *
 * What the source does (sampled from extracted frames):
 *  - Near-black field (median ~#080809, mean slightly above from the globe).
 *  - Dense thin geodesic / lat-lon wireframe, neutral gray ~#949298, most
 *    segments dim; brighter front-facing arcs ~#969498.
 *  - A darker crimson network of mostly-straight segments (core ~#804e4e to
 *    #875050, glow reads redder: treat as #8a2a32 with a soft #5a1820 bloom).
 *    Red pixels cover ~2.5–4% of the source frame.
 *  - Sparse tiny sparks (often <40 pixels in a 566×720 frame), pale
 *    pink-white / cool white, traveling on the mesh and red traces.
 *  - The globe slowly rotates; traces and sparks ride the rotating mesh.
 *
 * This canvas keeps the mesh, crimson traces, and traveling particles as a
 * page atmosphere — not a competing full-screen M/A logo-globe. A faint
 * perspective ground grid anchors the lineup, with the same particles
 * running along those lines.
 */
(function () {
  const TAU = Math.PI * 2;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function seeded(n) {
    let s = (n * 1597 + 51749) % 2147483647;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  class GridField {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: false });
      if (!this.ctx) {
        this.unsupported = true;
        canvas.setAttribute("hidden", "");
        return;
      }
      this.dpr = 1;
      this.w = 0;
      this.h = 0;
      this.t0 = performance.now();
      this.theta = 0;
      this.running = false;
      this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.mobile = false;
      this._paths = null;
      this._red = null;
      this._particles = [];
      this._last = 0;
      this.approach = 0; // 0 far, 1 close (initiation)
      this.resize();
      window.addEventListener("resize", () => this.resize());
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) this.running = false;
        else this.start();
      });
    }

    resize() {
      if (this.unsupported || !this.ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      this.dpr = dpr;
      this.w = w;
      this.h = h;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.mobile = w < 720;
      this._build();
    }

    _build() {
      const rand = seeded(42);
      const meridians = this.mobile ? 18 : 28;
      const parallels = this.mobile ? 10 : 14;
      const latSteps = this.mobile ? 28 : 40;
      const lonSteps = this.mobile ? 36 : 56;

      // Sphere paths in unit space (lat/lon polylines)
      const paths = [];
      for (let i = 0; i < meridians; i++) {
        const lon = (i / meridians) * TAU;
        const pts = [];
        for (let j = 0; j <= latSteps; j++) {
          const lat = -Math.PI / 2 + (j / latSteps) * Math.PI;
          pts.push(this._sph(lat, lon));
        }
        paths.push({ pts, kind: "meridian" });
      }
      for (let i = 1; i < parallels; i++) {
        const lat = -Math.PI / 2 + (i / parallels) * Math.PI;
        const pts = [];
        for (let j = 0; j <= lonSteps; j++) {
          const lon = (j / lonSteps) * TAU;
          pts.push(this._sph(lat, lon));
        }
        paths.push({ pts, kind: "parallel" });
      }
      this._paths = paths;

      // Crimson network: nodes on the sphere, k-nearest edges
      const nodeN = this.mobile ? 18 : 26;
      const nodes = [];
      for (let i = 0; i < nodeN; i++) {
        // fibonacci-ish distribution with jitter
        const y = 1 - (2 * (i + 0.5)) / nodeN;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const phi = i * 2.399963 + rand() * 0.25;
        nodes.push({ x: Math.cos(phi) * r, y, z: Math.sin(phi) * r });
      }
      const edges = [];
      const seen = new Set();
      const k = 3;
      for (let i = 0; i < nodes.length; i++) {
        const d = nodes.map((n, j) => ({
          j,
          d: (n.x - nodes[i].x) ** 2 + (n.y - nodes[i].y) ** 2 + (n.z - nodes[i].z) ** 2
        }));
        d.sort((a, b) => a.d - b.d);
        let added = 0;
        for (const item of d) {
          if (item.j === i) continue;
          const key = i < item.j ? `${i}-${item.j}` : `${item.j}-${i}`;
          if (seen.has(key)) {
            added++;
            if (added >= k) break;
            continue;
          }
          // skip very long chords so traces stay local like the source
          if (item.d > 1.15) continue;
          seen.add(key);
          edges.push({ a: i, b: item.j, pulse: rand(), speed: 0.15 + rand() * 0.35 });
          added++;
          if (added >= k) break;
        }
      }
      this._red = { nodes, edges };

      // Perspective ground grid lines (for particles to travel)
      const ground = [];
      const vpY = 0.50;
      const rows = this.mobile ? 8 : 12;
      const cols = this.mobile ? 9 : 13;
      for (let i = 1; i <= rows; i++) {
        const t = i / rows;
        ground.push({ kind: "h", t, speed: 0.04 + (i % 3) * 0.01 });
      }
      for (let i = 0; i < cols; i++) {
        const u = (i / (cols - 1)) * 2 - 1; // -1..1
        ground.push({ kind: "v", u, speed: 0.06 + Math.abs(u) * 0.04 });
      }
      this._ground = ground;

      // Particles
      const nSphere = this.mobile ? 36 : 70;
      const nRed = this.mobile ? 10 : 18;
      const nGround = this.mobile ? 20 : 36;
      const nSparks = this.mobile ? 6 : 12;
      const particles = [];
      for (let i = 0; i < nSphere; i++) {
        particles.push({
          kind: "sphere",
          path: Math.floor(rand() * paths.length),
          s: rand(),
          dir: rand() < 0.5 ? 1 : -1,
          speed: 0.025 + rand() * 0.055,
          size: 0.7 + rand() * 1.4,
          color: rand() < 0.22 ? "red" : rand() < 0.55 ? "white" : "pale"
        });
      }
      for (let i = 0; i < nRed; i++) {
        particles.push({
          kind: "red",
          edge: Math.floor(rand() * edges.length),
          s: rand(),
          dir: rand() < 0.5 ? 1 : -1,
          speed: 0.08 + rand() * 0.14,
          size: 1.1 + rand() * 1.8,
          color: "red"
        });
      }
      for (let i = 0; i < nGround; i++) {
        particles.push({
          kind: "ground",
          line: Math.floor(rand() * ground.length),
          s: rand(),
          dir: rand() < 0.5 ? 1 : -1,
          speed: 0.03 + rand() * 0.07,
          size: 0.8 + rand() * 1.3,
          color: rand() < 0.3 ? "red" : "white"
        });
      }
      for (let i = 0; i < nSparks; i++) {
        particles.push({
          kind: "spark",
          path: Math.floor(rand() * paths.length),
          s: rand(),
          dir: rand() < 0.5 ? 1 : -1,
          speed: 0.07 + rand() * 0.12,
          size: 1.4 + rand() * 1.6,
          color: "pale",
          blink: rand() * TAU
        });
      }
      this._particles = particles;
    }

    _sph(lat, lon) {
      const cl = Math.cos(lat);
      return { x: cl * Math.cos(lon), y: Math.sin(lat), z: cl * Math.sin(lon) };
    }

    _rotate(p, theta, tilt) {
      // rotY(theta) then rotX(tilt)
      const cy = Math.cos(theta), sy = Math.sin(theta);
      let x = p.x * cy + p.z * sy;
      let y = p.y;
      let z = -p.x * sy + p.z * cy;
      const cx = Math.cos(tilt), sx = Math.sin(tilt);
      const y2 = y * cx - z * sx;
      const z2 = y * sx + z * cx;
      return { x, y: y2, z: z2 };
    }

    _proj(p) {
      const { w, h } = this;
      const close = this.approach || 0;
      const R = Math.max(w, h) * (0.48 + 0.55 * close);
      const cx = w * 0.50;
      const cy = h * (0.50 - 0.04 * close);
      const cam = 2.55 - 0.45 * close;
      const z = p.z + cam;
      const k = (R * cam) / z;
      return {
        x: cx + p.x * k,
        y: cy + p.y * k,
        z: p.z,
        vis: 0.10 + 0.55 * ((p.z + 1) / 2)
      };
    }

    _groundPoint(line, s) {
      const { w, h } = this;
      const vpX = w * 0.5;
      const vpY = h * 0.50;
      const bottom = h + 20;
      const spread = w * 1.15;
      if (line.kind === "h") {
        const y = vpY + (bottom - vpY) * Math.pow(line.t, 1.35);
        const half = (spread * 0.5) * ((y - vpY) / (bottom - vpY));
        return { x: vpX - half + 2 * half * s, y, fade: 0.18 + 0.35 * line.t };
      }
      const y = vpY + (bottom - vpY) * s;
      const t = (y - vpY) / (bottom - vpY);
      const x = vpX + line.u * (spread * 0.5) * t;
      return { x, y, fade: 0.12 + 0.4 * t };
    }

    setApproach(p) {
      this.approach = Math.max(0, Math.min(1, p));
    }

    start() {
      if (this.unsupported || !this.ctx) return;
      if (this.running) return;
      this.running = true;
      this._last = performance.now();
      const loop = (now) => {
        if (!this.running) return;
        const dt = Math.min(0.05, (now - this._last) / 1000);
        this._last = now;
        this.draw(now, dt);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    draw(now, dt) {
      const ctx = this.ctx;
      const { w, h } = this;
      const t = (now - this.t0) / 1000;
      // Source clip is 9.825s; a partial rotation over that span.
      // Match a slow continuous drift (~one turn / 28s), still readable behind figures.
      const speed = this.reduced ? 0 : 1;
      this.theta += dt * speed * (TAU / 28);

      ctx.fillStyle = "#080809";
      ctx.fillRect(0, 0, w, h);

      const tilt = 0.38;
      const theta = this.theta;

      // --- Ground grid (behind the sphere, faint) ---
      ctx.save();
      ctx.lineWidth = 0.7;
      for (const line of this._ground) {
        if (line.kind === "h") {
          const a = this._groundPoint(line, 0);
          const b = this._groundPoint(line, 1);
          ctx.strokeStyle = `rgba(148,146,152,${0.10 + 0.16 * line.t})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        } else {
          const a = this._groundPoint(line, 0);
          const b = this._groundPoint(line, 1);
          ctx.strokeStyle = "rgba(148,146,152,0.13)";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.restore();

      // Soft vignette wash so the globe doesn't compete with figures
      const rot = (p) => this._rotate(p, theta, tilt);

      // --- Sphere mesh ---
      ctx.lineWidth = this.mobile ? 0.55 : 0.65;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const path of this._paths) {
        // split into front/back segments by projected z
        let curr = null;
        let last = null;
        for (const p of path.pts) {
          const q = this._proj(rot(p));
          if (!curr) {
            curr = { front: q.z > -0.02, pts: [q] };
            last = q;
            continue;
          }
          const front = q.z > -0.02;
          if (front !== curr.front) {
            this._strokeMesh(ctx, curr);
            curr = { front, pts: [last, q] };
          } else {
            curr.pts.push(q);
          }
          last = q;
        }
        if (curr) this._strokeMesh(ctx, curr);
      }

      // --- Crimson traces ---
      const { nodes, edges } = this._red;
      const pn = nodes.map((n) => this._proj(rot(n)));
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const e of edges) {
        const A = pn[e.a], B = pn[e.b];
        const midZ = (A.z + B.z) / 2;
        if (midZ < -0.35) continue; // hide far backface
        const alpha = 0.22 + 0.55 * ((midZ + 1) / 2);
        // glow
        ctx.strokeStyle = `rgba(90, 24, 32, ${alpha * 0.85})`;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();
        // core — muted source crimson, slightly lifted so it reads at page scale
        ctx.strokeStyle = `rgba(138, 42, 50, ${alpha})`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.stroke();

        // traveling pulse along the edge (like a charged segment)
        if (!this.reduced) {
          const u = (e.pulse + t * e.speed) % 1;
          const px = lerp(A.x, B.x, u);
          const py = lerp(A.y, B.y, u);
          const g = ctx.createRadialGradient(px, py, 0, px, py, 7);
          g.addColorStop(0, `rgba(196, 70, 76, ${0.55 * alpha})`);
          g.addColorStop(1, "rgba(196, 70, 76, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, TAU);
          ctx.fill();
        }
      }
      // nodes
      for (const q of pn) {
        if (q.z < -0.2) continue;
        const a = 0.25 + 0.55 * ((q.z + 1) / 2);
        ctx.fillStyle = `rgba(160, 48, 54, ${a})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 1.35, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // --- Particles ---
      const colors = {
        white: [236, 234, 238],
        pale: [210, 176, 180], // pink-white spark from source samples
        red: [196, 62, 68]
      };
      for (const p of this._particles) {
        if (!this.reduced) {
          p.s = (p.s + p.speed * p.dir * dt + 1) % 1;
        }
        let pt = null;
        let fade = 1;
        if (p.kind === "sphere" || p.kind === "spark") {
          const path = this._paths[p.path];
          const idx = p.s * (path.pts.length - 1);
          const i0 = Math.floor(idx);
          const i1 = Math.min(path.pts.length - 1, i0 + 1);
          const u = idx - i0;
          const a = rot(path.pts[i0]);
          const b = rot(path.pts[i1]);
          const m = { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u) };
          if (m.z < -0.15) continue;
          pt = this._proj(m);
          fade = pt.vis;
        } else if (p.kind === "red") {
          const e = this._red.edges[p.edge];
          if (!e) continue;
          const A = pn[e.a], B = pn[e.b];
          if ((A.z + B.z) / 2 < -0.25) continue;
          pt = { x: lerp(A.x, B.x, p.s), y: lerp(A.y, B.y, p.s), z: lerp(A.z, B.z, p.s) };
          fade = 0.35 + 0.65 * (((pt.z + 1) / 2));
        } else if (p.kind === "ground") {
          const line = this._ground[p.line];
          const g = this._groundPoint(line, p.s);
          pt = { x: g.x, y: g.y };
          fade = g.fade;
        }
        if (!pt) continue;
        let [r, g, b] = colors[p.color] || colors.white;
        let alpha = fade;
        if (p.kind === "spark") {
          alpha *= 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 6 + p.blink));
        }
        const rad = p.size * (this.mobile ? 0.9 : 1);
        const glow = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, rad * 4.2);
        glow.addColorStop(0, `rgba(${r},${g},${b},${0.85 * alpha})`);
        glow.addColorStop(0.35, `rgba(${r},${g},${b},${0.28 * alpha})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, rad * 4.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, 0.95 * alpha)})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0.6, rad * 0.55), 0, TAU);
        ctx.fill();
      }

      // Vignette so edges fall back to black (like the source frame falloff)
      const vg = ctx.createRadialGradient(w * 0.5, h * 0.46, h * 0.15, w * 0.5, h * 0.5, Math.max(w, h) * 0.78);
      vg.addColorStop(0, "rgba(8,8,9,0)");
      vg.addColorStop(0.62, "rgba(8,8,9,0.15)");
      vg.addColorStop(1, "rgba(8,8,9,0.72)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);
    }

    _strokeMesh(ctx, seg) {
      if (seg.pts.length < 2) return;
      const avg = seg.pts.reduce((s, p) => s + p.vis, 0) / seg.pts.length;
      const a = seg.front ? 0.16 + 0.22 * avg : 0.05 + 0.08 * avg;
      ctx.strokeStyle = `rgba(148, 146, 152, ${a})`;
      ctx.beginPath();
      ctx.moveTo(seg.pts[0].x, seg.pts[0].y);
      for (let i = 1; i < seg.pts.length; i++) ctx.lineTo(seg.pts[i].x, seg.pts[i].y);
      ctx.stroke();
    }
  }

  window.GridField = GridField;
})();
