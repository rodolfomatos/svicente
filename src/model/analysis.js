/**
 * Métricas de análise para teste de hipóteses (T007 — SPEC §7).
 *
 * Geometria pura (sem DOM/Three.js). Entradas: segmentos traçados pelo
 * investigador em coordenadas normalizadas [0,1] por painel + dados de
 * mundo de cada painel (origem, base ortonormal, dimensões efectivas).
 *
 * PROVENIÊNCIA: os traçados são medições explícitas do investigador
 * (MEDIDO); métricas derivadas herdam MEDIDO. As tolerâncias de corte
 * (TOLERANCES) são ESTIMADAS — pontos de corte para leitura, não
 * verdades históricas. Nenhuma métrica decide uma hipótese: quantifica
 * compatibilidade geométrica para o investigador confrontar com
 * evidência documental (SPEC §1, §8).
 *
 * Métricas (definições em docs/METODOLOGIA.md §8):
 * - por painel: direção dominante dos traçados (média circular módulo
 *   180°, ponderada por comprimento), dispersão angular e ponto de fuga
 *   aparente (interseções pareadas, centróide + RMS);
 * - por par de painéis próximos: distância entre rectângulos, ângulo
 *   diedro entre faces (0° = coplanaridade) e continuidade transfronteira
 *   (melhor par de traçados que cruzam a aresta comum: desvio angular e
 *   afastamento entre rectas 3D).
 */

/** Cortes ESTIMADOS para leitura de compatibilidade. */
export const TOLERANCES = Object.freeze({
  adjacencyDistanceM: 0.75, // par de painéis é "vizinho" se rectângulos < este afastamento
  continuityAngleDeg: 5, // desvio angular máximo para leitura "alinhado"
  continuityGapM: 0.1, // afastamento máximo entre rectas 3D para "alinhado"
  edgeTolUv: 0.03, // traçado "cruza a aresta" se extremidade a <3% da largura dela
  provenance: 'ESTIMADO',
});

const DEG = 180 / Math.PI;

/** Ângulo (graus, [0,180)) de uma recta implícita ax+by+c=0. */
function lineAngleDeg(l) {
  const ang = Math.atan2(-l.a, l.b) * DEG; // direcção = (−b, a)
  return ((ang % 180) + 180) % 180;
}

/**
 * Ajuste de recta por mínimos quadrados totais (TLS) a segmentos UV.
 * Recta implícita ax+by+c=0 com (a,b) unitário; resíduos = |ax+by+c|.
 *
 * @param {{a:{u:number,v:number}, b:{u:number,v:number}}[]} segments
 * @returns {{a:number,b:number,c:number,angleDeg:number,rms:number,
 *            points:{u:number,v:number}[]}|null} null se <2 pontos
 */
export function fitLineTLS(segments) {
  const pts = segments.flatMap((s) => [
    { u: s.a.u, v: s.a.v },
    { u: s.b.u, v: s.b.v },
  ]);
  if (pts.length < 2) return null;
  const n = pts.length;
  const cu = pts.reduce((s, p) => s + p.u, 0) / n;
  const cv = pts.reduce((s, p) => s + p.v, 0) / n;
  let suu = 0,
    svv = 0,
    suv = 0;
  for (const p of pts) {
    const du = p.u - cu,
      dv = p.v - cv;
    suu += du * du;
    svv += dv * dv;
    suv += du * dv;
  }
  // Autovector do menor autovalor de [[suu,suv],[suv,svv]] (2×2 fechado).
  const tr = suu + svv;
  const disc = Math.sqrt((suu - svv) ** 2 + 4 * suv * suv);
  const lambda = (tr - disc) / 2;
  let nu, nv;
  if (Math.abs(suv) < 1e-15) {
    if (suu <= svv) {
      nu = 1;
      nv = 0;
    } else {
      nu = 0;
      nv = 1;
    }
  } else {
    nu = suv;
    nv = lambda - suu;
  }
  const nl = Math.hypot(nu, nv) || 1;
  nu /= nl;
  nv /= nl;
  const c = -(nu * cu + nv * cv);
  let sq = 0;
  for (const p of pts) sq += (nu * p.u + nv * p.v + c) ** 2;
  return {
    a: nu,
    b: nv,
    c,
    angleDeg: lineAngleDeg({ a: nu, b: nv }),
    rms: Math.sqrt(sq / n),
    points: pts,
  };
}

/**
 * Interseção de duas rectas implícitas; null se paralelas (|det|<1e-12).
 */
export function intersectLines(l1, l2) {
  const det = l1.a * l2.b - l2.a * l1.b;
  if (Math.abs(det) < 1e-12) return null;
  // Cramer: a1·u + b1·v = −c1 ; a2·u + b2·v = −c2
  return {
    u: (l1.b * l2.c - l2.b * l1.c) / det,
    v: (l1.c * l2.a - l2.c * l1.a) / det,
  };
}

/** Centróide e RMS de dispersão de um conjunto de pontos. */
export function pointScatter(points) {
  if (!points.length) return null;
  const cu = points.reduce((s, p) => s + p.u, 0) / points.length;
  const cv = points.reduce((s, p) => s + p.v, 0) / points.length;
  const rms = Math.sqrt(
    points.reduce((s, p) => s + (p.u - cu) ** 2 + (p.v - cv) ** 2, 0) / points.length
  );
  return { u: cu, v: cv, rms };
}

/**
 * Direcção dominante (graus, módulo 180°) e dispersão (RMS angular,
 * graus) dos traçados de um painel, ponderadas por comprimento UV.
 */
export function dominantDirection(segments) {
  if (!segments.length) return null;
  let s2 = 0,
    c2 = 0,
    wsum = 0;
  const angs = [];
  for (const s of segments) {
    const du = s.b.u - s.a.u,
      dv = s.b.v - s.a.v;
    const w = Math.hypot(du, dv);
    if (w < 1e-12) continue;
    const th = Math.atan2(dv, du);
    angs.push({ th, w });
    s2 += w * Math.sin(2 * th);
    c2 += w * Math.cos(2 * th);
    wsum += w;
  }
  if (!angs.length) return null;
  const mean = 0.5 * Math.atan2(s2, c2);
  let dev2 = 0;
  for (const { th, w } of angs) {
    let d = th - mean;
    d = Math.atan2(Math.sin(d), Math.cos(d)); // enrola a [-π, π]
    dev2 += w * d * d;
  }
  return {
    angleDeg: (((mean * DEG) % 180) + 180) % 180,
    spreadDeg: Math.sqrt(dev2 / wsum) * DEG,
  };
}

/**
 * Ponto de fuga aparente de um painel: interseções pareadas dos traçados
 * (só com ≥2 traçados), com dispersão RMS. Interseções fora de [−2,3]
 * (muito além da imagem) são rejeitadas como ruído.
 */
export function apparentVanishingPoint(segments) {
  const fits = segments.map((s) => fitLineTLS([s])).filter(Boolean);
  if (fits.length < 2) return null;
  const pts = [];
  for (let i = 0; i < fits.length; i++) {
    for (let j = i + 1; j < fits.length; j++) {
      const p = intersectLines(fits[i], fits[j]);
      if (p && p.u > -2 && p.u < 3 && p.v > -2 && p.v < 3) pts.push(p);
    }
  }
  const sc = pointScatter(pts);
  return sc ? { ...sc, n: pts.length } : null;
}

/**
 * Ponto UV → mundo: origem + eixo horizontal·(u−½)·largura + eixo
 * vertical·(v−½)·altura. Convenção UV do PlaneGeometry (v=0 base).
 *
 * @param {{origin:{x,y,z}, right:{x,y,z}, up:{x,y,z}, width, height}} panel
 */
export function uvToWorld(panel, u, v) {
  const lu = (u - 0.5) * panel.width;
  const lv = (v - 0.5) * panel.height;
  return {
    x: panel.origin.x + panel.right.x * lu + panel.up.x * lv,
    y: panel.origin.y + panel.right.y * lu + panel.up.y * lv,
    z: panel.origin.z + panel.right.z * lu + panel.up.z * lv,
  };
}

/** Segmento UV → segmento 3D (extremidades). */
export function segmentWorld(segment, panel) {
  return {
    a: uvToWorld(panel, segment.a.u, segment.a.v),
    b: uvToWorld(panel, segment.b.u, segment.b.v),
  };
}

/** Ângulo diedro (graus, 0 = faces paralelas = coplanar) entre normais. */
export function dihedralDeg(n1, n2) {
  const dot = n1.x * n2.x + n1.y * n2.y + n1.z * n2.z;
  const l1 = Math.hypot(n1.x, n1.y, n1.z);
  const l2 = Math.hypot(n2.x, n2.y, n2.z);
  const cos = Math.min(1, Math.max(-1, dot / (l1 * l2)));
  return Math.acos(cos) * DEG;
}

/** Canto do rectângulo do painel no plano XZ (ordem: sup. inf., esq. dir.). */
export function rectCornersXZ(panel) {
  const out = [];
  for (const lu of [-panel.width / 2, panel.width / 2]) {
    for (const lv of [-panel.height / 2, panel.height / 2]) {
      const w = {
        x: panel.origin.x + panel.right.x * lu + panel.up.x * lv,
        z: panel.origin.z + panel.right.z * lu + panel.up.z * lv,
      };
      out.push(w);
    }
  }
  return out;
}

/** Distância 2D entre dois segmentos (clamped). */
function segDist2D(p1, p2, p3, p4) {
  const u = { x: p2.x - p1.x, z: p2.z - p1.z };
  const v = { x: p4.x - p3.x, z: p4.z - p3.z };
  const w = { x: p1.x - p3.x, z: p1.z - p3.z };
  const a = u.x * u.x + u.z * u.z;
  const b = u.x * v.x + u.z * v.z;
  const c = v.x * v.x + v.z * v.z;
  const d = u.x * w.x + u.z * w.z;
  const e = v.x * w.x + v.z * w.z;
  const D = a * c - b * b;
  let sN,
    sD = D,
    tN,
    tD = D;
  if (D < 1e-12) {
    sN = 0;
    sD = 1;
    tN = e;
    tD = c;
  } else {
    sN = b * e - c * d;
    tN = a * e - b * d;
    if (sN < 0) {
      sN = 0;
      tN = e;
      tD = c;
    } else if (sN > sD) {
      sN = sD;
      tN = e + b;
      tD = c;
    }
  }
  if (tN < 0) {
    tN = 0;
    if (-d < 0) sN = 0;
    else if (-d > a) sN = sD;
    else {
      sN = -d;
      sD = a;
    }
  } else if (tN > tD) {
    tN = tD;
    if (-d + b < 0) sN = 0;
    else if (-d + b > a) sN = sD;
    else {
      sN = -d + b;
      sD = a;
    }
  }
  const sc = Math.abs(sN) < 1e-12 ? 0 : sN / sD;
  const tc = Math.abs(tN) < 1e-12 ? 0 : tN / tD;
  const dx = w.x + sc * u.x - tc * v.x;
  const dz = w.z + sc * u.z - tc * v.z;
  return Math.hypot(dx, dz);
}

/** Distância mínima entre dois rectângulos de painel no plano XZ. */
export function rectDistanceXZ(panelA, panelB) {
  const ca = rectCornersXZ(panelA);
  const cb = rectCornersXZ(panelB);
  let best = Infinity;
  const edges = (c) => [
    [c[0], c[1]],
    [c[2], c[3]],
    [c[0], c[2]],
    [c[1], c[3]],
  ];
  for (const [p1, p2] of edges(ca)) {
    for (const [p3, p4] of edges(cb)) {
      const d = segDist2D(p1, p2, p3, p4);
      if (d < best) best = d;
    }
  }
  return best;
}

/** Distância perpendicular de um ponto a uma recta 3D (ponto-director+unitário). */
function distPointLine3D(p, a, d) {
  const w = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
  const proj = w.x * d.x + w.y * d.y + w.z * d.z;
  return Math.hypot(w.x - d.x * proj, w.y - d.y * proj, w.z - d.z * proj);
}

/**
 * Continuidade entre dois traçados 3D: desvio angular (graus, agudo) e
 * afastamento médio entre as rectas infinitas (m). Duas rectas da mesma
 * linha física têm ~0 em ambas.
 */
export function continuityBetween(wSegA, wSegB) {
  const dAraw = {
    x: wSegA.b.x - wSegA.a.x,
    y: wSegA.b.y - wSegA.a.y,
    z: wSegA.b.z - wSegA.a.z,
  };
  const dBraw = {
    x: wSegB.b.x - wSegB.a.x,
    y: wSegB.b.y - wSegB.a.y,
    z: wSegB.b.z - wSegB.a.z,
  };
  const lA = Math.hypot(dAraw.x, dAraw.y, dAraw.z);
  const lB = Math.hypot(dBraw.x, dBraw.y, dBraw.z);
  if (lA < 1e-12 || lB < 1e-12) return null;
  const dA = { x: dAraw.x / lA, y: dAraw.y / lA, z: dAraw.z / lA };
  const dB = { x: dBraw.x / lB, y: dBraw.y / lB, z: dBraw.z / lB };
  const dot = Math.min(1, Math.abs(dA.x * dB.x + dA.y * dB.y + dA.z * dB.z));
  const gap =
    0.5 *
    (distPointLine3D(wSegB.b, wSegA.a, dA) + distPointLine3D(wSegA.a, wSegB.a, dB));
  return { angleDeg: Math.acos(dot) * DEG, gapM: gap };
}

/**
 * Análise completa do layout activo.
 *
 * @param {Array} panels dados de mundo + traçados por painel:
 *   {id, origin, right, up, width, height, segments:[{a:{u,v},b:{u,v}}]}
 * @returns {{panels: object[], pairs: object[], tolerances: object}}
 */
export function analyzeLayout(panels) {
  const perPanel = panels.map((p) => {
    const dom = dominantDirection(p.segments);
    const vp = apparentVanishingPoint(p.segments);
    return {
      id: p.id,
      nSegments: p.segments.length,
      dominantDeg: dom?.angleDeg ?? null,
      spreadDeg: dom?.spreadDeg ?? null,
      vp,
    };
  });

  const pairs = [];
  for (let i = 0; i < panels.length; i++) {
    for (let j = i + 1; j < panels.length; j++) {
      const A = panels[i],
        B = panels[j];
      const dist = rectDistanceXZ(A, B);
      if (dist > TOLERANCES.adjacencyDistanceM) continue;
      const nA = {
        x: A.right.y * A.up.z - A.right.z * A.up.y,
        y: A.right.z * A.up.x - A.right.x * A.up.z,
        z: A.right.x * A.up.y - A.right.y * A.up.x,
      };
      const nB = {
        x: B.right.y * B.up.z - B.right.z * B.up.y,
        y: B.right.z * B.up.x - B.right.x * B.up.z,
        z: B.right.x * B.up.y - B.right.y * B.up.x,
      };
      pairs.push({
        a: A.id,
        b: B.id,
        distanceM: dist,
        dihedralDeg: dihedralDeg(nA, nB),
        continuity: continuityForPair(A, B),
      });
    }
  }
  return { panels: perPanel, pairs, tolerances: TOLERANCES };
}

/** Melhor par de traçados que cruzam a aresta comum de dois painéis. */
function continuityForPair(A, B) {
  const toB = {
    x: B.origin.x - A.origin.x,
    y: B.origin.y - A.origin.y,
    z: B.origin.z - A.origin.z,
  };
  const dotRightA = toB.x * A.right.x + toB.y * A.right.y + toB.z * A.right.z;
  const edgeA = dotRightA > 0 ? 1 : 0;
  const toA = { x: -toB.x, y: -toB.y, z: -toB.z };
  const dotRightB = toA.x * B.right.x + toA.y * B.right.y + toA.z * B.right.z;
  const edgeB = dotRightB > 0 ? 1 : 0;
  const near = (p, edge) =>
    p.segments.filter(
      (s) =>
        Math.min(Math.abs(s.a.u - edge), Math.abs(s.b.u - edge)) < TOLERANCES.edgeTolUv
    );
  const candA = near(A, edgeA);
  const candB = near(B, edgeB);
  let best = null;
  let n = 0;
  for (const sA of candA) {
    for (const sB of candB) {
      const m = continuityBetween(segmentWorld(sA, A), segmentWorld(sB, B));
      if (!m) continue;
      n += 1;
      if (
        !best ||
        m.angleDeg < best.angleDeg - 1e-9 ||
        (Math.abs(m.angleDeg - best.angleDeg) < 1e-9 && m.gapM < best.gapM)
      ) {
        best = m;
      }
    }
  }
  return { nCandidates: n, best };
}
