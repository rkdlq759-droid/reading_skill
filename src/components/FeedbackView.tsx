"use client";

import { useState } from "react";
import { FeedbackResponse, Question } from "@/lib/claude";
import { Award, Lightbulb, CheckCircle, XCircle, RefreshCcw, BookOpen, FileText } from "lucide-react";

interface FeedbackViewProps {
  passage: string;
  feedback: FeedbackResponse;
  questions: Question[];
  userAnswers: number[];
  onReset: () => void;
}

export default function FeedbackView({ passage, feedback, questions, userAnswers, onReset }: FeedbackViewProps) {
  const [activeTab, setActiveTab] = useState<"feedback" | "passage">("feedback");

  return (
    <div className="flex flex-col h-full bg-background animate-in zoom-in-95 duration-500 pb-10">
      <header className="p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-2">
          <Award size={32} />
        </div>
        <h1 className="text-2xl font-bold">학습 분석 결과</h1>
        <div className="text-4xl font-black text-primary">{feedback.score}<span className="text-lg text-gray-500 font-normal"> / 100</span></div>
      </header>

      {/* Tabs */}
      <div className="px-6 flex gap-2">
        <button
          onClick={() => setActiveTab("feedback")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-t-xl text-sm font-medium transition-colors ${
            activeTab === "feedback" 
              ? "bg-gray-800 text-primary border-b-2 border-primary" 
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <FileText size={16} />
          피드백 리포트
        </button>
        <button
          onClick={() => setActiveTab("passage")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-t-xl text-sm font-medium transition-colors ${
            activeTab === "passage" 
              ? "bg-gray-800 text-primary border-b-2 border-primary" 
              : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <BookOpen size={16} />
          원문 다시보기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-900/30">
        {activeTab === "feedback" ? (
          <div className="space-y-8">
            <section className="bg-card border border-gray-800 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-secondary font-bold">
                <CheckCircle size={20} />
                <h2>요약 피드백</h2>
              </div>
              <p className="text-foreground/90 leading-relaxed text-sm whitespace-pre-wrap">
                {feedback.summaryFeedback}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <XCircle size={20} className="text-red-400" />
                문제 풀이 분석
              </h2>
              <div className="space-y-4">
                {questions.map((q, idx) => {
                  const isCorrect = q.correctAnswer === (userAnswers[idx] + 1);
                  return (
                    <div key={idx} className={`p-4 rounded-xl border ${isCorrect ? "border-green-900/30 bg-green-900/10" : "border-red-900/30 bg-red-900/10"}`}>
                      <p className="font-medium text-sm mb-2">Q{idx + 1}. {q.question}</p>
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className={isCorrect ? "text-green-400" : "text-red-400 font-bold"}>
                          내 답변: {q.options[userAnswers[idx]]}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="text-xs text-green-400">
                          정답: {q.options[q.correctAnswer - 1]}
                        </div>
                      )}
                      <p className="mt-3 text-xs text-gray-400 leading-relaxed italic">
                        {q.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 bg-gray-800/50 rounded-xl text-sm text-gray-300">
                {feedback.questionFeedback}
              </div>
            </section>

            <section className="bg-primary/10 border border-primary/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold">
                <Lightbulb size={20} />
                <h2>향후 독해 전략</h2>
              </div>
              <p className="text-foreground/90 leading-relaxed text-sm whitespace-pre-wrap">
                {feedback.readingStrategy}
              </p>
            </section>

            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-bold transition-all shadow-lg"
            >
              <RefreshCcw size={18} />
              새로운 주제로 도전하기
            </button>
          </div>
        ) : (
          <div className="bg-card border border-gray-800 rounded-2xl p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-xl font-bold mb-6 border-b border-gray-800 pb-4">학습 지문 원문</h2>
            <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap space-y-4 text-sm md:text-base">
              {passage}
            </div>
            <button
              onClick={() => setActiveTab("feedback")}
              className="mt-8 w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors"
            >
              피드백 결과로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
