import Anthropic from "@anthropic-ai/sdk";

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface StructureItem {
  paragraphIndex: number;
  role: string;
}

export interface PassageResponse {
  title: string;
  content: string;
  questions: Question[];
  structure: StructureItem[];
}

export interface FeedbackResponse {
  score: number;
  summaryFeedback: string;
  questionFeedback: string;
  readingStrategy: string;
}

const MODEL = "claude-haiku-4-5-20251001";

function createAnthropicClient() {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is not defined");

  return new Anthropic({
    apiKey,
    defaultHeaders: {
      "anthropic-version": "2023-06-01",
    },
  });
}

function parseJsonObject<T>(text: string): T {
  const withoutCodeFence = text.replace(/```(?:json)?\n?|```/g, "").trim();
  const start = withoutCodeFence.indexOf("{");
  const end = withoutCodeFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Claude did not return JSON: ${withoutCodeFence.slice(0, 300)}`);
  }

  return JSON.parse(withoutCodeFence.slice(start, end + 1)) as T;
}

export async function generatePassage(topic: string): Promise<PassageResponse> {
  const anthropic = createAnthropicClient();

  const prompt = `
주제: "${topic}"

성인/직장인이 읽기 좋은 전문적인 한국어 독해 지문을 작성하세요.
난이도는 고등학교 1학년 이상, 수능 비문학 또는 경제/기술 기사 수준으로 맞추세요.

조건:
- 지문은 3~5개 단락으로 구성하세요.
- 각 단락은 \\n\\n으로 구분하세요.
- 글의 논리 구조가 명확해야 합니다.
- 지문 내용만 근거로 풀 수 있는 객관식 문제 3개를 만드세요.
- 정답은 지문 안에서 논리적으로 추론 가능해야 합니다.
- 각 단락이 전체 글에서 맡는 역할을 structure 배열에 넣으세요.
- 모든 내용은 한국어로 작성하세요.

출력은 반드시 아래 구조의 유효한 JSON 객체 하나만 반환하세요. 설명, 마크다운, 코드블록은 쓰지 마세요.
{
  "title": "지문 제목",
  "content": "지문 내용. 단락은 \\n\\n으로 구분",
  "questions": [
    {
      "id": 1,
      "question": "문제 내용",
      "options": ["1번 선택지", "2번 선택지", "3번 선택지", "4번 선택지"],
      "correctAnswer": 1,
      "explanation": "정답 및 오답 해설"
    }
  ],
  "structure": [
    {
      "paragraphIndex": 0,
      "role": "도입 및 배경 설명"
    }
  ]
}

주의: correctAnswer는 반드시 1부터 시작하는 선택지 번호입니다.
`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
    system: "You are a professional Korean educational content creator. Always respond with valid JSON only.",
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from Claude");

  return parseJsonObject<PassageResponse>(content.text);
}

export async function evaluatePerformance(
  passage: string,
  userSummary: string,
  questions: Question[],
  userAnswers: number[]
): Promise<FeedbackResponse> {
  const anthropic = createAnthropicClient();
  const answerLines = userAnswers
    .map((answer, index) => {
      const selected = answer >= 0 ? `${answer + 1}번` : "미선택";
      return `문제 ${index + 1}: ${selected}`;
    })
    .join("\n");

  const prompt = `
다음은 사용자가 읽은 지문, 사용자가 남긴 단락별 핵심 키워드, 객관식 문제, 사용자의 답안입니다.

[지문]
${passage}

[사용자가 남긴 핵심 키워드]
${userSummary}

[문제와 정답 정보]
${JSON.stringify(questions)}

[사용자 답안]
${answerLines}

아래 기준으로 평가하세요.
1. 100점 만점으로 점수를 산정하세요. 객관식 정답 60%, 핵심 키워드의 적절성 40%로 반영하세요.
2. summaryFeedback에는 사용자의 키워드가 핵심을 잘 잡았는지, 빠진 내용은 무엇인지 설명하세요.
3. questionFeedback에는 틀린 문제가 있다면 왜 틀렸는지, 지문의 어느 부분을 봐야 했는지 설명하세요.
4. readingStrategy에는 다음 독해에서 바로 적용할 수 있는 전략을 제안하세요.
5. 모든 응답은 한국어로 작성하세요.

출력은 반드시 아래 구조의 유효한 JSON 객체 하나만 반환하세요. 설명, 마크다운, 코드블록은 쓰지 마세요.
{
  "score": 85,
  "summaryFeedback": "핵심 키워드에 대한 피드백",
  "questionFeedback": "문제 풀이에 대한 피드백",
  "readingStrategy": "다음 독해 전략"
}
`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2500,
    messages: [{ role: "user", content: prompt }],
    system: "You are a professional Korean reading tutor. Always respond with valid JSON only.",
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from Claude");

  return parseJsonObject<FeedbackResponse>(content.text);
}
