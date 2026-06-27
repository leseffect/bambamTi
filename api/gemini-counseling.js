/**
 * 🔒 보안 점검 사항:
 * 1. 프론트엔드에 API 키를 넣으면 개발자 도구에서 노출될 수 있어, 이 Vercel Serverless Function에서 API 키 호출을 대행합니다.
 * 2. .env 파일은 절대 GitHub에 올리지 않으며, .gitignore에 등록되어 있습니다.
 * 3. Vercel 배포 시에는 Project Settings -> Environment Variables에 GEMINI_API_KEY를 등록해야 합니다.
 * 4. Gemini로 전송하는 데이터는 이름, 학번, 사진 경로를 제외한 최소한의 익명화 정보로 제한합니다.
 */

export default async function handler(req, res) {
  // 1. POST 요청만 허용
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // 2. process.env.GEMINI_API_KEY 존재 확인
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.' });
  }

  // 3. 요청 body 값 검증
  const { studentAlias, gradeSummary, learningTraits, teacherConcern } = req.body;
  if (!studentAlias || !gradeSummary || !learningTraits || !teacherConcern) {
    return res.status(400).json({ success: false, error: '필수 요청 데이터가 누락되었습니다.' });
  }

  // 4. Gemini API 호출을 위한 프롬프트 구성
  const systemInstruction = `너는 학교 교사를 돕는 전문적인 'AI 학생 상담 전략 도우미'이다. 다음 지침을 철저하게 준수하여 교사에게 상담 전략을 제공하라.

[핵심 프롬프트 원칙]
1. 절대 학생을 단정적으로 판단하거나 심리학적/의학적으로 진단하지 말라.
2. "의지가 부족하다", "주의력에 문제가 있다", "정서적/심리적 문제가 있다" 등 단정적이거나 편견이 섞인 표현은 절대 사용하지 말라.
3. 교사가 학생의 행동이나 성적 뒤에 숨겨진 원인과 상황을 이해하고, 학생과 존중하며 대화할 수 있도록 돕는 방향으로 응답하라.
4. "AI 상담 전략은 참고용입니다. 최종 판단과 실제 상담은 교사가 학생의 상황을 종합적으로 고려하여 진행해야 합니다."라는 안내 문구를 반드시 포함하라.

[응답 형식]
답변은 반드시 다음 순서와 형식의 소제목을 포함하여 구조화된 형식으로 한국어로 작성하라. 소제목은 ## 또는 ### 와 같이 마크다운 헤더로 작성하라.

1. 현재 상황 요약
2. 학생 데이터 기반 해석
3. 상담 접근 전략
4. 교사가 던질 수 있는 질문 3개
5. 피해야 할 말 또는 주의점
6. 다음 수업에서 해볼 수 있는 작은 지원`;

  const prompt = `[학생 정보 및 교사의 고민]
- 학생 식별 가명: ${studentAlias}
- 학생 성적 정보: ${gradeSummary}
- 학생 학습 특성: ${learningTraits}
- 교사의 상담 고민: ${teacherConcern}

위 정보를 바탕으로 핵심 지침에 맞추어 전문적인 학생 상담 전략을 제안해 주십시오.`;

  // 5. Gemini REST API 호출 (모델: gemini-2.5-pro)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\n${prompt}`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error Response:', data);
      return res.status(response.status).json({
        success: false,
        error: data.error?.message || 'Gemini API 호출 중 오류가 발생했습니다.'
      });
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) {
      return res.status(500).json({ success: false, error: 'Gemini로부터 올바른 응답을 받지 못했습니다.' });
    }

    return res.status(200).json({ success: true, result: resultText });
  } catch (err) {
    console.error('Fetch Exception:', err);
    return res.status(500).json({ success: false, error: '서버 내부 오류로 Gemini API 호출에 실패했습니다.' });
  }
}
