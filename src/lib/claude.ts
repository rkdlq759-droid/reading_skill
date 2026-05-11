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

export async function generatePassage(topic: string): Promise<PassageResponse> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is not defined in .env.local");

  const anthropic = new Anthropic({
    apiKey: apiKey,
    defaultHeaders: {
      "anthropic-version": "2023-06-01"
    }
  });

  const prompt = `
    주제: "${topic}"에 관한 성인/직장인 수준의 전문적인 독해 지문을 작성해주세요. 
    난이도는 고등학교 1학년 이상, 가급적 수능 비문학 또는 경제/기술 잡지 기사 수준으로 작성하십시오.
    
    지문은 3~5개의 단락으로 구성하고, 글의 논리 구조(예: 대조, 인과, 정의 등)가 명확해야 합니다.
    또한 지문의 내용을 바탕으로 한 객관식 문제 3개를 만들어주세요.
    반드시 지문에 명시된 사실만을 바탕으로 문제를 구성하고, 정답이 지문 내에서 논리적으로 도출되도록 하세요.
    각 문제는 지문에 근거하여 정답을 찾을 수 있어야 하며, 오답 해설도 포함해야 합니다.

    추가로, 각 문단이 전체 글에서 어떤 논리적 역할(예: 도입, 현상 분석, 핵심 원인 설명, 반론 제시, 최종 요약 등)을 하는지 분석하여 structure 배열에 담아주세요.
    
    반드시 한국어로 작성하세요.
    
    출력은 반드시 아래 JSON 구조를 따르는 유효한 JSON 객체여야 합니다:
    {
      "title": "지문 제목",
      "content": "지문 내용 (단락 구분은 \\n\\n 사용)",
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
    ※ 주의: correctAnswer는 반드시 1부터 시작하는 번호여야 합니다 (예: 1번 선택지가 정답이면 1, 2번이면 2).
  `;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
    system: "You are a professional educational content creator. Always respond with valid JSON only.",
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error("Unexpected response from Claude");
  
  // Strip markdown code blocks if present
  const cleanedText = content.text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(cleanedText);
}

export interface FeedbackResponse {
  score: number;
  summaryFeedback: string;
  questionFeedback: string;
  readingStrategy: string;
}

export async function evaluatePerformance(
  passage: string,
  userSummary: string,
  questions: Question[],
  userAnswers: number[]
): Promise<FeedbackResponse> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is not defined in .env.local");

  const anthropic = new Anthropic({
    apiKey: apiKey,
    defaultHeaders: {
      "anthropic-version": "2023-06-01"
    }
  });

  const prompt = `
    다음은 사용자가 읽은 지문과 그에 대한 요약본, 그리고 문제 풀이 결과입니다.
    
    [지문]
    ${passage}
    
    [사용자 요약본]
    ${userSummary}
    
    [문제 및 정답 정보]
    ${JSON.stringify(questions)}
    
    [사용자 선택 답변]
    ${userAnswers.map((ans, i) => `문제 ${i + 1}: ${ans + 1}번 선택지 선택`).join("\n")}
    
    위 데이터를 바탕으로 다음을 수행하세요:
    1. 100점 만점 기준으로 점수를 산정하세요 (문제 정답률 60%, 요약의 정확성 및 구조화 40%).
    2. 요약본에 대한 피드백을 주십시오 (핵심 키워드가 포함되었는지, 구조가 잡혔는지 등).
    3. 틀린 문제가 있다면 왜 틀렸을지, 지문의 어느 부분을 놓쳤을지 분석해주십시오.
    4. 사용자의 독해 습관을 교정하거나 발전시키기 위한 '독해 전략'을 구체적으로 제안하십시오 (예: 첫 문장에서 화제 파악하기, 접속사에 주목하기 등).
    
    반드시 한국어로 작성하세요.
    
    출력은 반드시 아래 JSON 구조를 따르는 유효한 JSON 객체여야 합니다:
    {
      "score": 85,
      "summaryFeedback": "요약에 대한 상세 피드백",
      "questionFeedback": "문제 풀이에 대한 상세 분석",
      "readingStrategy": "제안하는 독해 전략"
    }
  `;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
    system: "You are a professional Korean language tutor. Always respond with valid JSON only.",
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error("Unexpected response from Claude");

  const cleanedText = content.text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(cleanedText);
}
