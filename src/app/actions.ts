"use server";

import {
  evaluatePerformance,
  evaluatePreviewSummary,
  FeedbackResponse,
  ParagraphTask,
  PassageResponse,
  Question,
  SummaryFeedbackResponse,
  generatePassage,
} from "@/lib/claude";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export async function getPassageAction(topic: string): Promise<PassageResponse> {
  try {
    const data = await generatePassage(topic);
    return data;
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("Error generating passage:", message);
    throw new Error(
      process.env.NODE_ENV === "development"
        ? `지문을 생성하는 중 오류가 발생했습니다. 상세: ${message}`
        : "지문을 생성하는 중 오류가 발생했습니다."
    );
  }
}

export async function getSummaryFeedbackAction(
  paragraph: string,
  summary: string
): Promise<SummaryFeedbackResponse> {
  try {
    const data = await evaluatePreviewSummary(paragraph, summary);
    return data;
  } catch (error) {
    console.error("Error evaluating summary:", error);
    throw new Error("요약 피드백을 생성하는 중 오류가 발생했습니다.");
  }
}

export async function getFeedbackAction(
  passage: string,
  previewParagraph: string,
  userSummary: string,
  summaryFeedback: SummaryFeedbackResponse,
  paragraphTasks: ParagraphTask[],
  userSelections: number[][],
  questions: Question[],
  userAnswers: number[]
): Promise<FeedbackResponse> {
  try {
    const data = await evaluatePerformance(
      passage,
      previewParagraph,
      userSummary,
      summaryFeedback,
      paragraphTasks,
      userSelections,
      questions,
      userAnswers
    );
    return data;
  } catch (error) {
    console.error("Error evaluating performance:", error);
    throw new Error("피드백을 생성하는 중 오류가 발생했습니다.");
  }
}
