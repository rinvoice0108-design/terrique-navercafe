import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const POST_TYPES = [
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

export async function generatePosts() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY가 .env에 없습니다.');

  const brand    = load('brand.md');
  const types    = load('post-types.md');
  const examples = load('examples.md');
  const weekLabel = getWeekLabel();

  const prompt = `당신은 테리크 브랜드의 맘카페 마케팅 원고 전문가입니다.
실제 맘카페 회원처럼 자연스러운 글을 씁니다.

## 브랜드 정보
${brand}

## 원고 유형 가이드
${types}

## 잘 된 원고 예시 (이 스타일과 말투를 반드시 참고)
${examples}

## 이번 주
${weekLabel}

## 작성 지침
- 9가지 유형 각 1개씩 총 9개 원고 세트를 작성하세요
- 각 세트는 제목 + 글 내용 + 댓글로 구성
- 글 내용: 반드시 테리크 단어 사용 금지, 순수 일반인 글
- 댓글: 테리크 자연스럽게 1회, 특징 1~2개, ㄴ으로 OP 반응 포함
- 말투: 실제 맘카페 스타일 (ㅋㅋ, ㅠㅠ, ~요, 줄바꿈 자유롭게)
- 각 유형마다 상황·소재가 겹치지 않게 다양하게
- 반드시 아래 JSON 형식으로만 응답 (코드블록 없이 순수 JSON)

{
  "week": "${weekLabel}",
  "posts": [
    {
      "type": "질문형",
      "title": "제목",
      "content": "글 내용 (줄바꿈은 \\n 사용)",
      "comment": "댓글 내용 (ㄴ 반응 포함)"
    },
    {
      "type": "후기형",
      "title": "제목",
      "content": "글 내용",
      "comment": "댓글 내용"
    },
    {
      "type": "공감형",
      "title": "제목",
      "content": "글 내용",
      "comment": "댓글 내용"
    },
    {
      "type": "꿀팁형",
      "title": "제목",
      "content": "글 내용",
      "comment": "댓글 내용"
    },
    {
      "type": "비교형",
      "title": "제목",
      "content": "글 내용",
      "comment": "댓글 내용"
    },
    {
      "type": "참여형",
      "title": "제목",
      "content": "글 내용",
      "comment": "댓글 내용"
    },
    {
      "type": "일상형",
      "title": "제목",
      "content": "글 내용",
      "comment": "댓글 내용"
    },
    {
      "type": "답례품/선물형",
      "title": "제목",
      "content": "글 내용",
      "comment": "댓글 내용"
    },
    {
      "type": "시즌/계절형",
      "title": "제목",
      "content": "글 내용",
      "comment": "댓글 내용"
    }
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
  return JSON.parse(jsonStr);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await generatePosts();
  console.log(JSON.stringify(result, null, 2));
}
