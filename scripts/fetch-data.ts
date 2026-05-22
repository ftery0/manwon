/**
 * fetch-data.ts
 *
 * 공공데이터 포털에서 서울 지하철 혼잡도 CSV 및 역정보를 다운로드하는 스크립트.
 *
 * 데이터 출처:
 *   - 혼잡도: https://www.data.go.kr/data/15071311/fileData.do (서울교통공사 혼잡도)
 *   - 역정보: https://data.seoul.go.kr/dataList/OA-15442/S/1/datasetView.do (서울 열린데이터 광장)
 *
 * 공공데이터 포털은 직접 HTTP fetch가 불가능(로그인/CORS/파일 다운로드 토큰 필요)하므로,
 * 이 스크립트는 다운로드 시도 후 실패 시 명확한 안내 메시지를 출력합니다.
 * 실제 운영 시에는 API 키를 발급받아 아래 API_KEY 환경변수에 설정하세요.
 *
 * Usage:
 *   pnpm tsx scripts/fetch-data.ts
 *   DATA_API_KEY=your_key pnpm tsx scripts/fetch-data.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const RAW_DIR = path.join(ROOT, "public", "data", "raw");

const API_KEY = process.env.DATA_API_KEY ?? "";

// 공공데이터 API 엔드포인트 (실제 key 필요)
const ENDPOINTS = {
  congestion:
    "https://api.odcloud.kr/api/15071311/v1/uddi:27573284-7f8f-4f6b-8e2d-0cf2f0a370c0?page=1&perPage=1000&serviceKey=" +
    encodeURIComponent(API_KEY),
  stations:
    "https://data.seoul.go.kr/SeoulRTHub/api/getSubwaySttnAcctoTnmtPsgrgCnt.do?serviceKey=" +
    encodeURIComponent(API_KEY) +
    "&type=json&startIndex=1&endIndex=1000",
};

async function ensureDir(dir: string) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

async function tryFetch(url: string, label: string): Promise<string | null> {
  console.log(`[fetch-data] ${label} 다운로드 시도...`);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json, text/csv, */*" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(
        `[fetch-data] ${label} 응답 실패: HTTP ${res.status} ${res.statusText}`
      );
      return null;
    }
    const text = await res.text();
    console.log(`[fetch-data] ${label} 다운로드 성공 (${text.length} bytes)`);
    return text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[fetch-data] ${label} 다운로드 실패: ${msg}`);
    return null;
  }
}

async function main() {
  await ensureDir(RAW_DIR);

  if (!API_KEY) {
    console.warn(
      "\n[fetch-data] DATA_API_KEY 환경변수가 설정되지 않았습니다.\n" +
        "  공공데이터 포털(https://www.data.go.kr)에서 API 키를 발급받아\n" +
        "  DATA_API_KEY=your_key pnpm tsx scripts/fetch-data.ts 로 실행하세요.\n" +
        "  API 키 없이는 실제 데이터를 다운로드할 수 없어 mock 데이터를 사용합니다.\n"
    );
  }

  let fetchedAny = false;

  const congestionRaw = await tryFetch(ENDPOINTS.congestion, "혼잡도 CSV");
  if (congestionRaw) {
    await writeFile(path.join(RAW_DIR, "congestion_raw.csv"), congestionRaw, "utf-8");
    console.log(`[fetch-data] 저장: ${path.join(RAW_DIR, "congestion_raw.csv")}`);
    fetchedAny = true;
  }

  const stationsRaw = await tryFetch(ENDPOINTS.stations, "역정보 JSON");
  if (stationsRaw) {
    await writeFile(path.join(RAW_DIR, "stations_raw.json"), stationsRaw, "utf-8");
    console.log(`[fetch-data] 저장: ${path.join(RAW_DIR, "stations_raw.json")}`);
    fetchedAny = true;
  }

  if (!fetchedAny) {
    console.log(
      "\n[fetch-data] 실제 데이터를 가져오지 못했습니다.\n" +
        "  preprocess.ts가 mock 데이터를 자동으로 생성합니다.\n" +
        "  pnpm data:preprocess 를 실행하세요.\n"
    );
    process.exit(0);
  }

  console.log("\n[fetch-data] 완료. pnpm data:preprocess 로 전처리를 실행하세요.");
}

main().catch((err) => {
  console.error("[fetch-data] 오류:", err);
  process.exit(1);
});
