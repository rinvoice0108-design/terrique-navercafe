import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generatePosts } from './generate.js';
import { sendEmail } from './send-email.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function saveLog(data) {
  const date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const dir = join(ROOT, 'output');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${date}.json`), JSON.stringify(data, null, 2), 'utf-8');
  console.log(`로그 저장 → output/${date}.json`);
}

async function run() {
  const date = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' });
  console.log(`[${date}] 테리크 맘카페 주간 원고 생성 시작`);

  try {
    console.log('1/2 Gemini로 9가지 유형 원고 생성 중...');
    const data = await generatePosts();

    console.log('2/2 이메일 발송 중...');
    await sendEmail(data);

    saveLog(data);
    console.log(`완료. 총 ${data.posts.length}개 원고 발송.`);
  } catch (err) {
    console.error('오류 발생:', err.message);
    process.exit(1);
  }
}

run();
