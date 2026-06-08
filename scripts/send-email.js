import 'dotenv/config';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';

const TYPE_COLORS = {
  '질문형':       '#6B8FC9',
  '후기형':       '#7DB87D',
  '공감형':       '#C97B7B',
  '꿀팁형':       '#C9A96B',
  '비교형':       '#9B7BC9',
  '참여형':       '#7BBEC9',
  '일상형':       '#C97BB0',
  '답례품/선물형': '#C9906B',
  '시즌/계절형':  '#8DAF6B',
};

function buildHtml(data) {
  const cards = data.posts.map((p, i) => {
    const color = TYPE_COLORS[p.type] || '#A08878';
    const content = p.content.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;br&gt;/g, '<br>');
    const comment = p.comment.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;br&gt;/g, '<br>');
    return `
    <div style="background:#fff;border:1px solid #e5e5e5;border-radius:12px;margin-bottom:24px;overflow:hidden;">
      <div style="background:${color};padding:10px 20px;">
        <span style="color:#fff;font-weight:700;font-size:13px;">${i + 1}. ${p.type}</span>
      </div>
      <div style="padding:20px 24px;">
        <p style="font-size:15px;font-weight:700;color:#1A1A1A;margin:0 0 12px;">${p.title}</p>
        <div style="background:#f8f8f8;border-radius:8px;padding:14px 16px;margin-bottom:14px;">
          <p style="font-size:11px;color:#999;margin:0 0 8px;">📝 글 내용</p>
          <p style="font-size:14px;color:#333;line-height:1.8;margin:0;white-space:pre-wrap;">${content}</p>
        </div>
        <div style="background:#fff8f0;border-radius:8px;padding:14px 16px;border-left:3px solid ${color};">
          <p style="font-size:11px;color:#999;margin:0 0 8px;">💬 댓글</p>
          <p style="font-size:14px;color:#333;line-height:1.8;margin:0;white-space:pre-wrap;">${comment}</p>
        </div>
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:12px;color:#A08878;letter-spacing:2px;margin:0 0 6px;">TERRIQUE · 맘카페 원고</p>
      <h1 style="font-size:22px;color:#1A1A1A;margin:0 0 6px;">${data.week} 원고 9종</h1>
      <p style="font-size:13px;color:#888;margin:0;">9가지 유형 원고 · 글 내용 그대로 올리고 댓글은 별도 계정으로</p>
    </div>
    ${cards}
    <div style="text-align:center;padding:20px 0;border-top:1px solid #e5e5e5;">
      <p style="font-size:12px;color:#bbb;margin:0;">테리크 맘카페 원고 자동화 · by Gemini AI</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmail(data, isTest = false) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const to = isTest ? process.env.EMAIL_USER : process.env.EMAIL_TO;
  const prefix = isTest ? '[테스트] ' : '';

  await transporter.sendMail({
    from: `"테리크 카페 원고봇" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${prefix}[테리크 맘카페] ${data.week} 원고 9종 도착`,
    html: buildHtml(data),
  });

  console.log(`이메일 발송 완료 → ${to}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dummy = {
    week: '2026년 6월 2주차',
    posts: Array.from({ length: 9 }, (_, i) => ({
      type: ['질문형','후기형','공감형','꿀팁형','비교형','참여형','일상형','답례품/선물형','시즌/계절형'][i],
      title: `테스트 제목 ${i + 1}`,
      content: `테스트 글 내용입니다.\n두 번째 줄입니다.`,
      comment: `테스트 댓글입니다.\nㄴ감사합니다!`,
    })),
  };
  await sendEmail(dummy, process.argv.includes('--test'));
}
