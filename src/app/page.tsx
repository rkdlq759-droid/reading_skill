"use client";

import { useState } from "react";
import { getPassageAction, getFeedbackAction } from "./actions";
import { PassageResponse, FeedbackResponse } from "@/lib/claude";
import TopicSelector from "@/components/TopicSelector";
import ReadingView from "@/components/ReadingView";
import FeedbackView from "@/components/FeedbackView";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [step, setStep] = useState<"topic" | "reading" | "feedback">("topic");
  const [isLoading, setIsLoading] = useState(false);
  const [passageData, setPassageData] = useState<PassageResponse | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);

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

  const handleTaskSubmit = async (summary: string, answers: number[]) => {
    if (!passageData) return;
    setIsLoading(true);
    setUserAnswers(answers);
    try {
      const fb = await getFeedbackAction(
        passageData.content,
        summary,
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
    setUserAnswers([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-lg font-medium animate-pulse text-center px-6">
            {step === "topic" ? "AI가 지문을 구성하고 있습니다..." : "AI가 성취도를 분석 중입니다..."}
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
          onSubmit={handleTaskSubmit}
          isLoading={isLoading}
        />
      )}

      {step === "feedback" && feedback && passageData && (
        <FeedbackView
          passage={passageData.content}
          feedback={feedback}
          questions={passageData.questions}
          userAnswers={userAnswers}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
