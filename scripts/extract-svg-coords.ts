/**
 * 공식 서울 노선도 SVG에서 역명 → 픽셀 좌표 매핑을 추출한다.
 *
 * 입력: public/seoul-subway-map.svg (viewBox 0 0 1150.36 1074.59)
 * 출력: src/lib/data/svg-coords.generated.ts
 *
 * 동작 원리:
 *   1) SVG XML 안의 <text x= y=> 요소를 모두 추출 (translate transform 지원)
 *   2) 텍스트 내용을 우리가 가진 STATIONS의 역명과 매칭
 *   3) 환승역(같은 이름 여러 호선)은 동일 좌표를 공유
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { GENERATED_STATIONS } from "../src/lib/data/stations.generated";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const SVG_PATH = resolve(ROOT, "public/seoul-subway-map.svg");
const OUT_PATH = resolve(ROOT, "src/lib/data/svg-coords.generated.ts");

interface TextNode {
  x: number;
  y: number;
  content: string;
}

/** parseFloat 안전 버전 */
function num(s: string | undefined): number | null {
  if (s == null) return null;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * SVG의 <text> 요소를 추출한다.
 * - x, y 속성 + content
 * - parent <g transform="translate(a, b)"> 지원 (간단한 케이스만)
 * - <text> 내부에 <tspan>이 있을 수도 있으니 그 텍스트 전체를 모은다
 */
function extractTexts(svg: string): TextNode[] {
  const texts: TextNode[] = [];

  const textRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let m: RegExpExecArray | null;
  while ((m = textRe.exec(svg)) !== null) {
    const attrs = m[1];
    const inner = m[2];

    // 좌표는 보통 transform="translate(x y)" 형태 (Adobe Illustrator 출력)
    let x: number | null = null;
    let y: number | null = null;

    const tx = /transform="translate\(\s*([-\d.]+)\s*[, ]\s*([-\d.]+)/.exec(attrs);
    if (tx) {
      x = parseFloat(tx[1]);
      y = parseFloat(tx[2]);
    } else {
      // 폴백: x= y= 속성
      x = num(/\bx="([^"]+)"/.exec(attrs)?.[1]);
      y = num(/\by="([^"]+)"/.exec(attrs)?.[1]);
    }

    if (x == null || y == null) continue;

    // <tspan>이 여러 개일 때 모두 합침, 그 다음 태그 제거
    const cleaned = inner
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned) continue;

    texts.push({ x, y, content: cleaned });
  }
  return texts;
}

/** "강 남" 같은 공백 분리 텍스트 정규화 */
function normalize(s: string): string {
  return s.replace(/\s+/g, "");
}

async function main() {
  const svg = await readFile(SVG_PATH, "utf-8");
  const texts = extractTexts(svg);
  console.log(`총 <text> 추출: ${texts.length}`);

  // 우리 데이터의 고유 역명 (호선 중복 제거)
  const knownNames = new Set(GENERATED_STATIONS.map((s) => s.name));
  console.log(`우리 STATIONS 고유 역명 수: ${knownNames.size}`);

  // 별칭 (우리 데이터 ↔ 노선도 표기 차이)
  const aliases: Record<string, string> = {
    "서울": "서울역",
    // 7호선 "뚝섬유원지"는 SVG에 표기 누락 — 별칭 잡으면 2호선 뚝섬과 같은 좌표에 겹치므로 폴백 처리에 맡김
  };

  // Pass 1: 정확 일치
  const coordMap = new Map<string, { x: number; y: number }>();
  const candidateBuckets = new Map<string, Array<{ x: number; y: number }>>();

  for (const t of texts) {
    const norm = normalize(t.content);
    if (knownNames.has(norm)) {
      if (!candidateBuckets.has(norm)) candidateBuckets.set(norm, []);
      candidateBuckets.get(norm)!.push({ x: t.x, y: t.y });
    }
  }
  for (const [name, cands] of candidateBuckets.entries()) {
    const avg = cands.reduce((a, c) => ({ x: a.x + c.x, y: a.y + c.y }), { x: 0, y: 0 });
    coordMap.set(name, { x: avg.x / cands.length, y: avg.y / cands.length });
  }

  // Pass 2: 누락 역명 → 두 줄 분리된 라벨 (예: "을지로" + "입구")
  // 또는 별칭 (예: "서울" → "서울역")
  // 또는 부역명 포함 텍스트 (예: "이수(총신대입구)")
  const stillMissing = (): string[] => [...knownNames].filter((n) => !coordMap.has(n));

  for (const target of stillMissing()) {
    // 별칭 시도
    const alias = aliases[target];
    if (alias) {
      const aliasMatches = texts.filter((t) => normalize(t.content) === alias);
      if (aliasMatches.length > 0) {
        const avg = aliasMatches.reduce(
          (a, c) => ({ x: a.x + c.x, y: a.y + c.y }),
          { x: 0, y: 0 }
        );
        coordMap.set(target, {
          x: avg.x / aliasMatches.length,
          y: avg.y / aliasMatches.length,
        });
        continue;
      }
    }

    // 두 줄 분리 시도: 가능한 모든 분할점 (앞 2글자 이상 + 뒤 1글자 이상)
    let best: { dist: number; x: number; y: number } | null = null;
    for (let i = 2; i < target.length; i++) {
      const part1 = target.slice(0, i);
      const part2 = target.slice(i);
      const t1Cands = texts.filter((t) => normalize(t.content) === part1);
      const t2Cands = texts.filter((t) => normalize(t.content) === part2);
      for (const t1 of t1Cands) {
        for (const t2 of t2Cands) {
          // 같은 역의 두 줄 라벨은 보통 가로/세로 10px 이내
          const dx = t1.x - t2.x;
          const dy = t1.y - t2.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= 10 && (!best || dist < best.dist)) {
            best = {
              dist,
              x: (t1.x + t2.x) / 2,
              y: (t1.y + t2.y) / 2,
            };
          }
        }
      }
    }
    if (best) {
      coordMap.set(target, { x: best.x, y: best.y });
      continue;
    }

    // 부역명 포함 매칭 (target을 substring으로 포함하는 텍스트)
    const containing = texts.filter((t) => normalize(t.content).includes(target));
    if (containing.length > 0) {
      // 첫 매칭 채택 (보통 한 곳)
      const c = containing[0];
      coordMap.set(target, { x: c.x, y: c.y });
    }
  }

  const matched = coordMap.size;
  const missing = [...knownNames].filter((n) => !coordMap.has(n));

  console.log(`매칭 성공: ${matched} / ${knownNames.size}`);
  console.log(`누락 (${missing.length}): ${missing.slice(0, 30).join(", ")}${missing.length > 30 ? " ..." : ""}`);

  // viewBox 정보
  const vb = /viewBox="([\d. -]+)"/.exec(svg)?.[1] ?? "0 0 1150.36 1074.59";
  const [, , vw, vh] = vb.split(/\s+/).map(Number);

  // 출력
  const sorted = [...coordMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const obj: Record<string, { x: number; y: number }> = {};
  for (const [k, v] of sorted) {
    obj[k] = {
      x: Math.round(v.x * 100) / 100,
      y: Math.round(v.y * 100) / 100,
    };
  }

  const out = `// AUTO-GENERATED by scripts/extract-svg-coords.ts — DO NOT EDIT MANUALLY.
// 공식 서울 노선도 SVG에서 추출한 역명 → 픽셀 좌표.
// SVG viewBox: 0 0 ${vw} ${vh}

export const SVG_VIEW_W = ${vw};
export const SVG_VIEW_H = ${vh};

export const SVG_STATION_COORDS: Record<string, { x: number; y: number }> = ${JSON.stringify(obj, null, 2)};
`;

  await writeFile(OUT_PATH, out, "utf-8");
  console.log(`→ ${OUT_PATH} (${matched}개 역, ${(out.length / 1024).toFixed(1)} KB)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
