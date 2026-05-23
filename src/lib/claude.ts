import Anthropic from "@anthropic-ai/sdk";

export interface ParagraphTask {
  paragraphIndex: number;
  keyPoints: string[];
  options: string[];
  correctAnswers: number[];
  explanation: string;
}

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
  previewParagraphIndex: number;
  paragraphTasks: ParagraphTask[];
  questions: Question[];
  structure: StructureItem[];
}

export interface SummaryFeedbackResponse {
  score: number;
  feedback: string;
  revisionTip: string;
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
- previewParagraphIndex에는 사용자가 전체 지문을 보기 전에 먼저 읽고 요약할 단락 하나의 0부터 시작하는 번호를 넣으세요.
- 사용자가 전체 지문을 읽은 뒤 각 단락의 핵심 내용을 확인할 수 있도록, 단락마다 3개의 핵심 내용을 만드세요.
- paragraphTasks.options에는 정답 3개를 포함해 총 6개의 선택지를 넣으세요.
- paragraphTasks.correctAnswers는 keyPoints 3개 각각에 해당하는 options의 1부터 시작하는 번호 배열입니다.
- 지문 내용만 근거로 풀 수 있는 객관식 문제 3개를 만드세요.
- 객관식 정답은 지문 안에서 논리적으로 추론 가능해야 합니다.
- 각 단락이 전체 글에서 맡는 역할을 structure 배열에 넣으세요.
- 모든 내용은 한국어로 작성하세요.

출력은 반드시 아래 구조의 유효한 JSON 객체 하나만 반환하세요. 설명, 마크다운, 코드블록은 쓰지 마세요.
{
  "title": "지문 제목",
  "content": "지문 내용. 단락은 \\n\\n으로 구분",
  "previewParagraphIndex": 1,
  "paragraphTasks": [
    {
      "paragraphIndex": 0,
      "keyPoints": ["첫 번째 핵심 내용", "두 번째 핵심 내용", "세 번째 핵심 내용"],
      "options": ["선택지 1", "선택지 2", "선택지 3", "선택지 4", "선택지 5", "선택지 6"],
      "correctAnswers": [2, 4, 1],
      "explanation": "이 단락에서 세 핵심 내용이 중요한 이유"
    }
  ],
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

주의: correctAnswers와 correctAnswer는 반드시 1부터 시작하는 선택지 번호입니다.
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

export async function evaluatePreviewSummary(
  paragraph: string,
  userSummary: string
): Promise<SummaryFeedbackResponse> {
  const anthropic = createAnthropicClient();

  const prompt = `
사용자가 전체 지문을 보기 전에 아래 단락 하나를 읽고 요약했습니다.

[단락]
${paragraph}

[사용자 요약]
${userSummary}

아래 기준으로 평가하세요.
1. score는 100점 만점입니다.
2. feedback에는 사용자가 단락의 중심 생각과 근거를 잘 잡았는지 구체적으로 설명하세요.
3. revisionTip에는 전체 지문을 읽기 전에 보완하면 좋은 한 가지 요약 전략을 제안하세요.
4. 모든 응답은 한국어로 작성하세요.

출력은 반드시 아래 구조의 유효한 JSON 객체 하나만 반환하세요. 설명, 마크다운, 코드블록은 쓰지 마세요.
{
  "score": 80,
  "feedback": "요약에 대한 피드백",
  "revisionTip": "보완 전략"
}
`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1600,
    messages: [{ role: "user", content: prompt }],
    system: "You are a professional Korean reading tutor. Always respond with valid JSON only.",
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response from Claude");

  return parseJsonObject<SummaryFeedbackResponse>(content.text);
}

export async function evaluatePerformance(
  passage: string,
  previewParagraph: string,
  userSummary: string,
  summaryFeedback: SummaryFeedbackResponse,
  paragraphTasks: ParagraphTask[],
  userSelections: number[][],
  questions: Question[],
  userAnswers: number[]
): Promise<FeedbackResponse> {
  const anthropic = createAnthropicClient();
  const paragraphAnswerLines = userSelections
    .map((answers, paragraphIndex) => {
      const selected = answers.map((answer) => (answer >= 0 ? `${answer + 1}번` : "미선택")).join(", ");
      return `단락 ${paragraphIndex + 1}: ${selected}`;
    })
    .join("\n");
  const questionAnswerLines = userAnswers
    .map((answer, index) => {
      const selected = answer >= 0 ? `${answer + 1}번` : "미선택";
      return `객관식 ${index + 1}: ${selected}`;
    })
    .join("\n");

  const prompt = `
다음은 사용자가 먼저 읽은 단락, 사용자의 요약, 요약 피드백, 전체 지문, 문단별 핵심 내용 과제, 객관식 문제, 사용자의 답안입니다.

[먼저 읽은 단락]
${previewParagraph}

[사용자 요약]
${userSummary}

[요약 피드백]
${JSON.stringify(summaryFeedback)}

[지문]
${passage}

[문단별 핵심 내용 과제와 정답 정보]
${JSON.stringify(paragraphTasks)}

[객관식 문제와 정답 정보]
${JSON.stringify(questions)}

[사용자의 문단별 핵심 선택]
${paragraphAnswerLines}

[사용자의 객관식 답안]
${questionAnswerLines}

아래 기준으로 평가하세요.
1. 100점 만점으로 점수를 산정하세요. 사전 요약 30%, 문단별 드롭다운 정답 35%, 객관식 정답 35%로 반영하세요.
2. summaryFeedback에는 사용자가 먼저 쓴 요약이 전체 지문 독해에 어떤 도움 또는 한계를 만들었는지 설명하세요.
3. questionFeedback에는 틀린 문단별 핵심 선택과 객관식 문제가 있다면 왜 틀렸는지, 지문의 어느 부분을 봐야 했는지 설명하세요.
4. readingStrategy에는 다음 독해에서 바로 적용할 수 있는 전략을 제안하세요.
5. 모든 응답은 한국어로 작성하세요.

출력은 반드시 아래 구조의 유효한 JSON 객체 하나만 반환하세요. 설명, 마크다운, 코드블록은 쓰지 마세요.
{
  "score": 85,
  "summaryFeedback": "사전 요약과 전체 독해 흐름에 대한 피드백",
  "questionFeedback": "문단별 핵심 내용 선택과 객관식 문제 풀이에 대한 피드백",
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
