import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const USED_TITLES_FILE = join(ROOT, 'output', 'used-titles.json');

const ALL_TYPES = [
  '질문형', '후기형', '공감형', '꿀팁형',
  '비교형', '참여형', '일상형', '답례품/선물형', '시즌/계절형',
];

function load(file) {
  return readFileSync(join(ROOT, 'knowledge', file), 'utf-8');
}

function getWeekLabel() {
  const now = new Date();
  const week = Math.ceil(now.getDate() / 7);
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${week}주차`;
}

function loadUsedTitles() {
  if (!existsSync(USED_TITLES_FILE)) return [];
  try {
    return JSON.parse(readFileSync(USED_TITLES_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveUsedTitles(existing, newTitles) {
  mkdirSync(join(ROOT, 'output'), { recursive: true });
  const updated = [...existing, ...newTitles].slice(-200); // 최근 200개만 유지
  writeFileSync(USED_TITLES_FILE, JSON.stringify(updated, null, 2), 'utf-8');
}

export async function generatePosts() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY가 .env에 없습니다.');

  const brand      = load('brand.md');
  const types      = load('post-types.md');
  const examples   = load('examples.md');
  const weekLabel  = getWeekLabel();
  const usedTitles = loadUsedTitles();

  const usedSection = usedTitles.length > 0
    ? `\n## 이미 사용한 제목 (절대 비슷하게도 쓰지 말 것)\n${usedTitles.map(t => `- ${t}`).join('\n')}\n`
    : '';

  const typeBlocks = ALL_TYPES.map(t =>
    `    {\n      "type": "${t}",\n      "title": "제목",\n      "content": "글 내용 (줄바꿈은 \\\\n 사용)",\n      "comment": "댓글 1줄"\n    }`
  ).join(',\n');

  const prompt = `당신은 테리크 브랜드의 맘카페 마케팅 원고 전문가입니다.
실제 맘카페 회원처럼 자연스러운 글을 씁니다.

## 브랜드 정보
${brand}

## 원고 유형 가이드
${types}

## 잘 된 원고 예시 (이 스타일과 말투를 반드시 참고)
${examples}
${usedSection}
## 이번 주
${weekLabel}

## 작성 지침
- 9가지 유형 각 1개씩 총 9개 원고 세트를 작성하세요
- 각 세트는 제목 + 글 내용 + 댓글 1줄로 구성
- 글 내용: 반드시 테리크 단어 사용 금지, 순수 일반인 글
- 댓글: 테리크 자연스럽게 1회 언급, 특징 1~2개, 딱 1줄로 작성
- 말투: 실제 맘카페 스타일 (ㅋㅋ, ㅠㅠ, ~요, 줄바꿈 자유롭게)
- 각 유형마다 상황·소재가 겹치지 않게 다양하게
- 반드시 아래 JSON 형식으로만 응답 (코드블록 없이 순수 JSON)

{
  "week": "${weekLabel}",
  "posts": [
${typeBlocks}
  ]
}`;

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.9, maxOutputTokens: 4000 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API 오류 ${res.status}: ${err}`);
  }

  const json = await res.json();
  const raw = json.candidates[0].content.parts[0].text.trim();
  const jsonStr = raw.startsWith('{') ? raw : raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  const result = JSON.parse(jsonStr);

  const newTitles = result.posts.map(p => p.title);
  saveUsedTitles(usedTitles, newTitles);
  console.log(`사용된 제목 누적: ${usedTitles.length + newTitles.length}개`);

  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await generatePosts();
  console.log(JSON.stringify(result, null, 2));
}
