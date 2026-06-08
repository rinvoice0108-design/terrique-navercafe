import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_FILE = join(__dirname, '..', 'output', 'holidays.json');

async function fetchFromApi(year) {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/KR`);
  if (!res.ok) throw new Error(`공휴일 API 오류 ${res.status}`);
  const data = await res.json();
  return data.map(h => h.date);
}

export async function getHolidays() {
  const year = new Date().getFullYear();

  let cache = {};
  try {
    if (existsSync(CACHE_FILE)) {
      cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch {}

  if (cache.year === year && Array.isArray(cache.holidays)) {
    return cache.holidays;
  }

  console.log(`${year}년 공휴일 자동 업데이트 중...`);
  const holidays = await fetchFromApi(year);
  mkdirSync(join(__dirname, '..', 'output'), { recursive: true });
  writeFileSync(CACHE_FILE, JSON.stringify(
    { year, holidays, updated: new Date().toISOString() },
    null, 2
  ), 'utf-8');
  console.log(`공휴일 ${holidays.length}개 업데이트 완료`);
  return holidays;
}
