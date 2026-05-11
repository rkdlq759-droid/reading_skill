import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const schema: Schema = {
    description: "Reading passage and questions",
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      content: { type: SchemaType.STRING },
      questions: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.NUMBER },
            question: { type: SchemaType.STRING },
            options: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            correctAnswer: { type: SchemaType.NUMBER },
            explanation: { type: SchemaType.STRING },
          },
          required: ["id", "question", "options", "correctAnswer", "explanation"],
        },
      },
      structure: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            paragraphIndex: { type: SchemaType.NUMBER },
            role: { type: SchemaType.STRING },
          },
          required: ["paragraphIndex", "role"],
        },
      },
    },
    required: ["title", "content", "questions", "structure"],
  };

  const prompt = `
    주제: "${topic}"에 관한 성인/직장인 수준의 전문적인 독해 지문을 작성해주세요. 
    난이도는 고등학교 1학년 이상, 가급적 수능 비문학 또는 경제/기술 잡지 기사 수준으로 작성하십시오.
    
    지문은 3~5개의 단락으로 구성하고, 글의 논리 구조(예: 대조, 인과, 정의 등)가 명확해야 합니다.
    
    또한 지문의 내용을 바탕으로 한 객관식 문제 3개를 만들어주세요.
    반드시 지문에 명시된 사실만을 바탕으로 문제를 구성하고, 정답이 지문 내에서 논리적으로 도출되도록 하세요.
    각 문제는 지문에 근거하여 정답을 찾을 수 있어야 하며, 오답 해설도 포함해야 합니다.

    추가로, 각 문단이 전체 글에서 어떤 논리적 역할(예: 도입, 현상 분석, 핵심 원인 설명, 반론 제시, 최종 요약 등)을 하는지 분석하여 structure 배열에 담아주세요.
    ※ 주의: correctAnswer는 반드시 1부터 시작하는 번호여야 합니다 (예: 1번 선택지가 정답이면 1, 2번이면 2).
    
    반드시 한국어로 작성하세요.
  `;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  return JSON.parse(result.response.text());
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const schema: Schema = {
    description: "Feedback on reading performance",
    type: SchemaType.OBJECT,
    properties: {
      score: { type: SchemaType.NUMBER },
      summaryFeedback: { type: SchemaType.STRING },
      questionFeedback: { type: SchemaType.STRING },
      readingStrategy: { type: SchemaType.STRING },
    },
    required: ["score", "summaryFeedback", "questionFeedback", "readingStrategy"],
  };

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
  `;

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });

  return JSON.parse(result.response.text());
}
