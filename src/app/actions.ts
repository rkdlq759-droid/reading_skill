"use server";

import { generatePassage, evaluatePerformance, PassageResponse, Question, FeedbackResponse } from "@/lib/claude";

export async function getPassageAction(topic: string): Promise<PassageResponse> {
  try {
    const data = await generatePassage(topic);
    return data;
  } catch (error) {
    console.error("Error generating passage:", error);
    throw new Error("지문을 생성하는 중 오류가 발생했습니다.");
  }
}

export async function getFeedbackAction(
  passage: string,
  userSummary: string,
  questions: Question[],
  userAnswers: number[]
): Promise<FeedbackResponse> {
  try {
    const data = await evaluatePerformance(passage, userSummary, questions, userAnswers);
    return data;
  } catch (error) {
    console.error("Error evaluating performance:", error);
    throw new Error("피드백을 생성하는 중 오류가 발생했습니다.");
  }
}
