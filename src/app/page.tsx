"use client";

import { useState } from "react";
import { getFeedbackAction, getPassageAction, getSummaryFeedbackAction } from "./actions";
import { FeedbackResponse, PassageResponse, SummaryFeedbackResponse } from "@/lib/claude";
import TopicSelector from "@/components/TopicSelector";
import ReadingView from "@/components/ReadingView";
import FeedbackView from "@/components/FeedbackView";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<"topic" | "reading" | "feedback">("topic");
  const [isLoading, setIsLoading] = useState(false);
  const [passageData, setPassageData] = useState<PassageResponse | null>(null);
  const [userSummary, setUserSummary] = useState("");
  const [summaryFeedback, setSummaryFeedback] = useState<SummaryFeedbackResponse | null>(null);
  const [userSelections, setUserSelections] = useState<number[][]>([]);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);

  const getParagraphs = (content: string) => content.split("\n\n").filter((text) => text.trim().length > 0);

  const handleTopicSelect = async (topic: string) => {
    console.log("Topic selected:", topic);
    setIsLoading(true);
    try {
      const data = await getPassageAction(topic);
      setPassageData(data);
      setStep("reading");
    } catch (error) {
      alert("지문을 생성하지 못했습니다. 다시 시도해주세요.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummaryFeedback = async (paragraph: string, summary: string) => {
    try {
      return await getSummaryFeedbackAction(paragraph, summary);
    } catch (error) {
      alert("요약 피드백을 생성하지 못했습니다. 다시 시도해주세요.");
      console.error(error);
      throw error;
    }
  };

  const handleTaskSubmit = async (
    summary: string,
    initialSummaryFeedback: SummaryFeedbackResponse,
    selections: number[][],
    answers: number[]
  ) => {
    if (!passageData) return;

    const paragraphs = getParagraphs(passageData.content);
    const previewIndex = Math.min(
      Math.max(passageData.previewParagraphIndex ?? 0, 0),
      Math.max(paragraphs.length - 1, 0)
    );
    const previewParagraph = paragraphs[previewIndex] ?? "";

    setIsLoading(true);
    setUserSummary(summary);
    setSummaryFeedback(initialSummaryFeedback);
    setUserSelections(selections);
    setUserAnswers(answers);
    try {
      const fb = await getFeedbackAction(
        passageData.content,
        previewParagraph,
        summary,
        initialSummaryFeedback,
        passageData.paragraphTasks,
        selections,
        passageData.questions,
        answers
      );
      setFeedback(fb);
      setStep("feedback");
    } catch (error) {
      alert("피드백을 생성하지 못했습니다. 다시 시도해주세요.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep("topic");
    setPassageData(null);
    setFeedback(null);
    setUserSummary("");
    setSummaryFeedback(null);
    setUserSelections([]);
    setUserAnswers([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-lg font-medium animate-pulse text-center px-6">
            {step === "topic" ? "AI가 지문을 구성하고 있습니다..." : "AI가 답안을 분석 중입니다..."}
          </p>
        </div>
      )}

      {step === "topic" && (
        <div className="flex-1 flex flex-col justify-center">
          <TopicSelector onSelect={handleTopicSelect} isLoading={isLoading} />
        </div>
      )}

      {step === "reading" && passageData && (
        <ReadingView
          data={passageData}
          onSummaryFeedback={handleSummaryFeedback}
          onSubmit={handleTaskSubmit}
          isLoading={isLoading}
        />
      )}

      {step === "feedback" && feedback && passageData && summaryFeedback && (
        <FeedbackView
          passage={passageData.content}
          feedback={feedback}
          paragraphTasks={passageData.paragraphTasks}
          userSelections={userSelections}
          questions={passageData.questions}
          userAnswers={userAnswers}
          userSummary={userSummary}
          summaryFeedback={summaryFeedback}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
