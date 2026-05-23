"use client";

import { useState } from "react";
import { FeedbackResponse, ParagraphTask, Question, SummaryFeedbackResponse } from "@/lib/claude";
import { Award, BookOpen, CheckCircle, FileText, Lightbulb, RefreshCcw, XCircle } from "lucide-react";

interface FeedbackViewProps {
  passage: string;
  feedback: FeedbackResponse;
  paragraphTasks: ParagraphTask[];
  userSelections: number[][];
  questions: Question[];
  userAnswers: number[];
  userSummary: string;
  summaryFeedback: SummaryFeedbackResponse;
  onReset: () => void;
}

export default function FeedbackView({
  passage,
  feedback,
  paragraphTasks,
  userSelections,
  questions,
  userAnswers,
  userSummary,
  summaryFeedback,
  onReset,
}: FeedbackViewProps) {
  const [activeTab, setActiveTab] = useState<"feedback" | "passage">("feedback");

  return (
    <div className="flex flex-col h-full bg-background animate-in zoom-in-95 duration-500 pb-10">
      <header className="p-6 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-2">
          <Award size={32} />
        </div>
        <h1 className="text-2xl font-bold">학습 분석 결과</h1>
        <div className="text-4xl font-black text-primary">
          {feedback.score}
          <span className="text-lg text-gray-500 font-normal"> / 100</span>
        </div>
      </header>

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
            <section className="bg-card border border-gray-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-secondary font-bold">
                  <CheckCircle size={20} />
                  <h2>사전 요약 피드백</h2>
                </div>
                <span className="rounded bg-primary/10 px-3 py-1 text-sm font-black text-primary">
                  {summaryFeedback.score}/100
                </span>
              </div>
              <div className="rounded-xl border border-gray-800 bg-background/45 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">내 요약</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">{userSummary}</p>
              </div>
              <p className="text-foreground/90 leading-relaxed text-sm whitespace-pre-wrap">
                {feedback.summaryFeedback}
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <XCircle size={20} className="text-red-400" />
                문단별 핵심 선택 분석
              </h2>
              <div className="space-y-4">
                {paragraphTasks.map((task, taskIdx) => {
                  const answers = userSelections[taskIdx] ?? [];
                  const correctAnswers = task.correctAnswers.slice(0, 3);
                  const correctCount = correctAnswers.filter(
                    (correctAnswer, answerIdx) => correctAnswer === (answers[answerIdx] ?? -1) + 1
                  ).length;
                  const isAllCorrect = correctCount === correctAnswers.length;

                  return (
                    <div
                      key={task.paragraphIndex}
                      className={`p-4 rounded-xl border ${
                        isAllCorrect ? "border-green-900/30 bg-green-900/10" : "border-red-900/30 bg-red-900/10"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="font-medium text-sm">문단 {task.paragraphIndex + 1}</p>
                        <span className={isAllCorrect ? "text-xs text-green-400" : "text-xs text-red-400 font-bold"}>
                          {correctCount}/{correctAnswers.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {correctAnswers.map((correctAnswer, answerIdx) => {
                          const selectedIndex = answers[answerIdx] ?? -1;
                          const isCorrect = correctAnswer === selectedIndex + 1;

                          return (
                            <div key={answerIdx} className="rounded-lg bg-background/35 p-3 text-xs leading-relaxed">
                              <p className={isCorrect ? "text-green-400" : "text-red-400 font-bold"}>
                                핵심 {answerIdx + 1}: {selectedIndex >= 0 ? task.options[selectedIndex] : "미선택"}
                              </p>
                              {!isCorrect && (
                                <p className="mt-1 text-green-400">정답: {task.options[correctAnswer - 1]}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="mt-3 text-xs text-gray-400 leading-relaxed italic">{task.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <XCircle size={20} className="text-red-400" />
                객관식 문제 분석
              </h2>
              <div className="space-y-4">
                {questions.map((question, idx) => {
                  const selectedIndex = userAnswers[idx] ?? -1;
                  const isCorrect = question.correctAnswer === selectedIndex + 1;

                  return (
                    <div
                      key={question.id}
                      className={`p-4 rounded-xl border ${
                        isCorrect ? "border-green-900/30 bg-green-900/10" : "border-red-900/30 bg-red-900/10"
                      }`}
                    >
                      <p className="font-medium text-sm mb-2">
                        Q{idx + 1}. {question.question}
                      </p>
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className={isCorrect ? "text-green-400" : "text-red-400 font-bold"}>
                          내 답변: {selectedIndex >= 0 ? question.options[selectedIndex] : "미선택"}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="text-xs text-green-400">
                          정답: {question.options[question.correctAnswer - 1]}
                        </div>
                      )}
                      <p className="mt-3 text-xs text-gray-400 leading-relaxed italic">
                        {question.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="p-4 bg-gray-800/50 rounded-xl text-sm text-gray-300 whitespace-pre-wrap">
              {feedback.questionFeedback}
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
