"use client";

import { FormEvent, useMemo, useState } from "react";
import { PassageResponse, SummaryFeedbackResponse } from "@/lib/claude";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  FileText,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquareText,
  Type,
} from "lucide-react";

interface ReadingViewProps {
  data: PassageResponse;
  onSummaryFeedback: (paragraph: string, summary: string) => Promise<SummaryFeedbackResponse>;
  onSubmit: (
    summary: string,
    summaryFeedback: SummaryFeedbackResponse,
    selections: number[][],
    answers: number[]
  ) => void;
  isLoading: boolean;
}

type ViewStage = "preview" | "summaryFeedback" | "fullReading" | "tasks";

const keyPointLabels = ["핵심 1", "핵심 2", "핵심 3"];

export default function ReadingView({ data, onSummaryFeedback, onSubmit, isLoading }: ReadingViewProps) {
  const paragraphs = useMemo(
    () => data.content.split("\n\n").filter((text) => text.trim().length > 0),
    [data.content]
  );
  const previewIndex = Math.min(Math.max(data.previewParagraphIndex ?? 0, 0), Math.max(paragraphs.length - 1, 0));
  const previewParagraph = paragraphs[previewIndex] ?? paragraphs[0] ?? "";
  const paragraphTasks = useMemo(
    () => [...data.paragraphTasks].sort((a, b) => a.paragraphIndex - b.paragraphIndex),
    [data.paragraphTasks]
  );

  const [stage, setStage] = useState<ViewStage>("preview");
  const [summary, setSummary] = useState("");
  const [summaryFeedback, setSummaryFeedback] = useState<SummaryFeedbackResponse | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [selections, setSelections] = useState<number[][]>(() =>
    paragraphTasks.map(() => new Array(3).fill(-1))
  );
  const [answers, setAnswers] = useState<number[]>(() => new Array(data.questions.length).fill(-1));

  const fontSizeClass = {
    sm: "text-sm md:text-base",
    base: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
  };

  const isDropdownValid = selections.every((answers) => answers.length > 0 && answers.every((answer) => answer >= 0));
  const isQuestionValid = answers.every((answer) => answer >= 0);
  const isTaskValid = isDropdownValid && isQuestionValid;

  const handleSummarySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!summary.trim()) return;

    setIsSummaryLoading(true);
    try {
      const feedback = await onSummaryFeedback(previewParagraph, summary.trim());
      setSummaryFeedback(feedback);
      setStage("summaryFeedback");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const handleSelectionChange = (paragraphIndex: number, keyPointIndex: number, value: string) => {
    const nextSelections = selections.map((answers) => [...answers]);
    nextSelections[paragraphIndex][keyPointIndex] = Number(value);
    setSelections(nextSelections);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => {
    const nextAnswers = [...answers];
    nextAnswers[questionIndex] = answerIndex;
    setAnswers(nextAnswers);
  };

  const handleFinalSubmit = () => {
    if (!summaryFeedback) return;
    onSubmit(summary.trim(), summaryFeedback, selections, answers);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background animate-in fade-in duration-500">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-800/50 bg-background/90 p-4 backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2">
          <BookOpen size={18} className="shrink-0 text-primary" />
          <h2 className="truncate text-sm font-bold md:text-base">{data.title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFontSize((prev) => (prev === "sm" ? "base" : prev === "base" ? "lg" : "sm"))}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            title="글자 크기 조절"
          >
            <Type size={18} />
          </button>
          <span className="rounded bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
            Flow Reading
          </span>
        </div>
      </header>

      {stage === "preview" && (
        <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-6 md:grid-cols-[minmax(0,1fr)_320px] md:px-8 md:py-10">
          <section className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">먼저 한 문단만 읽기</p>
              <h1 className="text-3xl font-black leading-tight text-primary/90 md:text-4xl">{data.title}</h1>
              <p className="text-sm leading-relaxed text-gray-400">
                전체 지문을 보기 전에 선택된 문단 하나를 읽고, 지금 이해한 내용을 직접 요약해 보세요.
              </p>
            </div>

            <article className="rounded-lg border border-primary/25 bg-card/70 p-5 shadow-xl shadow-primary/5 md:p-7">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded bg-gray-800/70 px-2 py-1 text-[10px] font-bold uppercase text-gray-400">
                  Paragraph {previewIndex + 1}
                </span>
                <span className="text-xs font-bold text-secondary">요약 전용 문단</span>
              </div>
              <p className={`reading-text whitespace-pre-wrap text-foreground/90 ${fontSizeClass[fontSize]}`}>
                {previewParagraph}
              </p>
            </article>

            <form onSubmit={handleSummarySubmit} className="space-y-4 rounded-lg border border-gray-800 bg-card/45 p-5">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-200">
                <MessageSquareText size={16} className="text-secondary" />
                이 문단을 한두 문장으로 요약하기
              </label>
              <textarea
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-lg border border-gray-700 bg-background/70 px-4 py-3 text-sm leading-relaxed outline-none transition-all placeholder:text-gray-600 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                placeholder="문단의 중심 생각과 근거를 포함해 요약해 보세요."
              />
              <button
                type="submit"
                disabled={!summary.trim() || isSummaryLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-secondary/90 disabled:opacity-35"
              >
                {isSummaryLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    요약 피드백 생성 중
                  </>
                ) : (
                  <>
                    피드백 받기
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="order-first h-fit rounded-lg border border-gray-800 bg-card/70 p-4 md:order-none md:sticky md:top-[73px]">
            <div className="mb-4 flex items-center gap-2 font-bold">
              <ListChecks size={17} className="text-secondary" />
              진행 흐름
            </div>
            <ol className="space-y-3 text-sm text-gray-400">
              <li className="font-bold text-secondary">1. 한 문단 읽고 요약</li>
              <li>2. 요약 피드백 확인</li>
              <li>3. 전체 지문 읽기</li>
              <li>4. 문단별 핵심 3가지 선택</li>
              <li>5. 객관식 문제 풀이</li>
              <li>6. 최종 피드백 확인</li>
            </ol>
          </aside>
        </main>
      )}

      {stage === "summaryFeedback" && summaryFeedback && (
        <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 md:px-8 md:py-10">
          <section className="space-y-5 rounded-lg border border-gray-800 bg-card/60 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-secondary">
                <Lightbulb size={20} />
                <h1 className="text-xl font-bold">요약 피드백</h1>
              </div>
              <span className="rounded bg-primary/10 px-3 py-1 text-sm font-black text-primary">
                {summaryFeedback.score}/100
              </span>
            </div>
            <div className="rounded-lg border border-gray-800 bg-background/45 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">내 요약</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">{summary}</p>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{summaryFeedback.feedback}</p>
            <div className="rounded-lg bg-primary/10 p-4 text-sm leading-relaxed text-primary">
              {summaryFeedback.revisionTip}
            </div>
          </section>

          <button
            onClick={() => setStage("fullReading")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-4 text-base font-bold text-white transition-all hover:bg-secondary/90"
          >
            전체 지문 읽기
            <ArrowRight size={18} />
          </button>
        </main>
      )}

      {stage === "fullReading" && (
        <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8 pb-28 md:px-8 md:py-10">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary">전체 지문 읽기</p>
            <h1 className="text-3xl font-black leading-tight text-primary/90 md:text-4xl">{data.title}</h1>
          </div>

          <div className="space-y-5">
            {paragraphs.map((paragraph, idx) => (
              <article
                key={`${idx}-${paragraph.slice(0, 16)}`}
                className={`rounded-lg border p-5 md:p-6 ${
                  idx === previewIndex ? "border-primary/30 bg-card/70" : "border-gray-800 bg-card/35"
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded bg-gray-800/70 px-2 py-1 text-[10px] font-bold uppercase text-gray-400">
                    Paragraph {idx + 1}
                  </span>
                  {idx === previewIndex && (
                    <span className="flex items-center gap-1 text-xs font-bold text-secondary">
                      <CheckCircle2 size={14} />
                      먼저 요약한 문단
                    </span>
                  )}
                </div>
                <p className={`reading-text whitespace-pre-wrap text-foreground/90 ${fontSizeClass[fontSize]}`}>
                  {paragraph}
                </p>
              </article>
            ))}
          </div>

          <button
            onClick={() => setStage("tasks")}
            className="fixed bottom-6 left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-4 text-base font-bold text-white shadow-2xl shadow-secondary/20 transition-all hover:bg-secondary/90"
          >
            핵심 내용 선택하기
            <ArrowRight size={18} />
          </button>
        </main>
      )}

      {stage === "tasks" && (
        <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8 pb-32 md:px-8 md:py-10">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setStage("fullReading")}
              className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ChevronLeft size={16} />
              지문으로 돌아가기
            </button>
            <span className="rounded bg-secondary/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-secondary">
              Dropdown Check
            </span>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={20} className="text-secondary" />
              <h1 className="text-2xl font-bold">문단별 핵심 내용 3가지</h1>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              각 문단을 다시 떠올리며 아래에서 위로 흐름을 정리하듯, 핵심 내용 3가지를 드롭다운에서 선택하세요.
            </p>
          </section>

          <section className="space-y-6">
            {paragraphTasks.map((task, taskIdx) => (
              <article key={task.paragraphIndex} className="space-y-5 rounded-lg border border-gray-800 bg-card/50 p-5">
                <div>
                  <span className="rounded bg-gray-800/70 px-2 py-1 text-[10px] font-bold uppercase text-gray-400">
                    Paragraph {task.paragraphIndex + 1}
                  </span>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-400">
                    {paragraphs[task.paragraphIndex]}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {(task.keyPoints.length > 0 ? task.keyPoints : keyPointLabels).slice(0, 3).map((_, keyPointIdx) => (
                    <label key={keyPointIdx} className="space-y-2">
                      <span className="text-xs font-bold text-secondary">{keyPointLabels[keyPointIdx]}</span>
                      <select
                        value={selections[taskIdx]?.[keyPointIdx] ?? -1}
                        onChange={(event) => handleSelectionChange(taskIdx, keyPointIdx, event.target.value)}
                        className="w-full rounded-lg border border-gray-700 bg-background px-3 py-3 text-sm text-foreground outline-none transition-all focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      >
                        <option value={-1}>정답 선택</option>
                        {task.options.map((option, optionIdx) => (
                          <option key={option} value={optionIdx}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <HelpCircle size={20} className="text-secondary" />
              <h2 className="text-2xl font-bold">객관식 확인 문제</h2>
            </div>

            {data.questions.map((question, questionIdx) => (
              <article key={question.id} className="space-y-4 rounded-lg border border-gray-800 bg-card/50 p-5">
                <p className="text-base font-bold leading-relaxed md:text-lg">
                  <span className="mr-2 text-secondary">Q{questionIdx + 1}.</span>
                  {question.question}
                </p>
                <div className="space-y-3">
                  {question.options.map((option, optionIdx) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleAnswerChange(questionIdx, optionIdx)}
                      className={`w-full rounded-lg border p-4 text-left transition-all duration-200 md:p-5 ${
                        answers[questionIdx] === optionIdx
                          ? "border-secondary bg-secondary/10 text-secondary shadow-lg shadow-secondary/10 ring-1 ring-secondary/50"
                          : "border-gray-800 bg-background/35 hover:border-gray-600 hover:bg-gray-800/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                            answers[questionIdx] === optionIdx
                              ? "border-secondary bg-secondary text-white"
                              : "border-gray-700"
                          }`}
                        >
                          {optionIdx + 1}
                        </span>
                        <span className="text-sm md:text-base">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </section>

          <div className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent p-6 pt-12">
            <div className="mx-auto w-full max-w-2xl">
              <button
                onClick={handleFinalSubmit}
                disabled={!isTaskValid || isLoading}
                className="w-full rounded-lg bg-secondary py-4 text-lg font-bold text-white shadow-2xl shadow-secondary/20 transition-all hover:bg-secondary/90 active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:shadow-none md:py-5"
              >
                {isLoading ? "AI 분석 중..." : "제출하고 결과 보기"}
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
