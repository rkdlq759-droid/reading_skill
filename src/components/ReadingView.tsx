"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { PassageResponse } from "@/lib/claude";
import {
  ArrowDown,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  HelpCircle,
  ListChecks,
  SkipForward,
  Tags,
  Type,
} from "lucide-react";

interface ReadingViewProps {
  data: PassageResponse;
  onSubmit: (summary: string, answers: number[]) => void;
  isLoading: boolean;
}

type ViewMode = "reading" | "tasks";

const splitKeywords = (value: string) =>
  value
    .split(/[,\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 4);

export default function ReadingView({ data, onSubmit, isLoading }: ReadingViewProps) {
  const paragraphs = useMemo(
    () => data.content.split("\n\n").filter((text) => text.trim().length > 0),
    [data.content]
  );

  const [view, setView] = useState<ViewMode>("reading");
  const [visibleCount, setVisibleCount] = useState(() => (paragraphs.length > 0 ? 1 : 0));
  const [keywordInputs, setKeywordInputs] = useState<string[]>(() => new Array(paragraphs.length).fill(""));
  const [answers, setAnswers] = useState<number[]>(() => new Array(data.questions.length).fill(-1));
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const activeParagraphRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeParagraphRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [visibleCount]);

  const activeIndex = Math.max(visibleCount - 1, 0);
  const hasMoreParagraphs = visibleCount < paragraphs.length;
  const activeKeywords = splitKeywords(keywordInputs[activeIndex] ?? "");
  const isFormValid = !answers.includes(-1);

  const fontSizeClass = {
    sm: "text-sm md:text-base",
    base: "text-base md:text-lg",
    lg: "text-lg md:text-xl",
  };

  const updateKeywords = (idx: number, value: string) => {
    const nextInputs = [...keywordInputs];
    nextInputs[idx] = value;
    setKeywordInputs(nextInputs);
  };

  const revealNextParagraph = () => {
    if (hasMoreParagraphs) {
      setVisibleCount((count) => Math.min(count + 1, paragraphs.length));
      return;
    }

    setView("tasks");
  };

  const handleKeywordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    revealNextParagraph();
  };

  const handleAnswerChange = (qIdx: number, aIdx: number) => {
    const nextAnswers = [...answers];
    nextAnswers[qIdx] = aIdx;
    setAnswers(nextAnswers);
  };

  const buildFlowSummary = () => {
    const keywordLines = paragraphs.map((_, idx) => {
      const keywords = splitKeywords(keywordInputs[idx] ?? "");
      const content = keywords.length > 0 ? keywords.join(", ") : "키워드 미입력";
      return `${idx + 1}단락: ${content}`;
    });

    return [
      `제목: ${data.title}`,
      "사용자가 읽으며 남긴 단락별 핵심 키워드:",
      ...keywordLines,
    ].join("\n");
  };

  if (view === "reading") {
    const completedCount = Math.max(visibleCount - 1, 0);

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

        <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 md:grid-cols-[minmax(0,1fr)_280px] md:px-8 md:py-8">
          <main className="min-w-0 space-y-6 pb-28">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary">단락을 읽고 핵심만 남기기</p>
              <h1 className="text-3xl font-black leading-tight text-primary/90 md:text-4xl">{data.title}</h1>
            </div>

            {paragraphs.slice(0, visibleCount).map((paragraph, idx) => {
              const isActive = idx === activeIndex;
              const keywords = splitKeywords(keywordInputs[idx] ?? "");

              return (
                <section
                  key={`${idx}-${paragraph.slice(0, 16)}`}
                  ref={isActive ? activeParagraphRef : null}
                  className={`rounded-lg border p-5 transition-all duration-500 md:p-6 ${
                    isActive
                      ? "border-primary/30 bg-card/70 shadow-xl shadow-primary/5"
                      : "border-gray-800 bg-card/35"
                  }`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="rounded bg-gray-800/70 px-2 py-1 text-[10px] font-bold uppercase text-gray-400">
                      Paragraph {idx + 1}
                    </span>
                    {!isActive && keywords.length > 0 && (
                      <span className="flex items-center gap-1 text-xs font-bold text-secondary">
                        <CheckCircle2 size={14} />
                        저장됨
                      </span>
                    )}
                  </div>

                  <p className={`reading-text whitespace-pre-wrap text-foreground/90 ${fontSizeClass[fontSize]}`}>
                    {paragraph}
                  </p>

                  {isActive ? (
                    <form onSubmit={handleKeywordSubmit} className="mt-6 space-y-4 border-t border-gray-800 pt-5">
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-200">
                        <Tags size={16} className="text-secondary" />
                        이 단락의 핵심 키워드 2~3개
                      </label>
                      <input
                        value={keywordInputs[idx] ?? ""}
                        onChange={(event) => updateKeywords(idx, event.target.value)}
                        className="w-full rounded-lg border border-gray-700 bg-background/70 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-600 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                        placeholder="예: 문제 제기, 비용 증가, 자동화"
                      />
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="submit"
                          disabled={activeKeywords.length === 0}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-secondary/90 disabled:opacity-35"
                        >
                          {hasMoreParagraphs ? (
                            <>
                              다음 단락 보기
                              <ArrowDown size={16} />
                            </>
                          ) : (
                            <>
                              문제로 이동
                              <ListChecks size={16} />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={revealNextParagraph}
                          className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-4 py-3 text-sm font-bold text-gray-300 transition-colors hover:border-gray-500 hover:bg-gray-800/50"
                        >
                          <SkipForward size={16} />
                          건너뛰기
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-800 pt-4">
                      {keywords.length > 0 ? (
                        keywords.map((keyword) => (
                          <span key={keyword} className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">키워드 없이 넘어간 단락</span>
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </main>

          <aside className="sticky top-[73px] order-first h-fit rounded-lg border border-gray-800 bg-card/70 p-4 md:order-none">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <ListChecks size={17} className="text-secondary" />
                흐름 가이드
              </div>
              <span className="text-xs text-gray-500">
                {completedCount}/{paragraphs.length}
              </span>
            </div>
            <div className="space-y-3">
              {paragraphs.map((_, idx) => {
                const isVisible = idx < visibleCount;
                const keywords = splitKeywords(keywordInputs[idx] ?? "");

                return (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 ${
                      isVisible ? "border-gray-700 bg-background/45" : "border-gray-800/70 bg-background/20 opacity-45"
                    }`}
                  >
                    <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      P{idx + 1}
                    </div>
                    {keywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {keywords.map((keyword) => (
                          <span key={keyword} className="rounded bg-secondary/10 px-2 py-1 text-[11px] font-bold text-secondary">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">{isVisible ? "읽는 중" : "아직 잠김"}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background animate-in slide-in-from-right duration-500">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-800/50 bg-background/90 p-4 backdrop-blur-xl">
        <button
          onClick={() => setView("reading")}
          className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ChevronLeft size={16} />
          지문으로 돌아가기
        </button>
        <span className="rounded bg-secondary/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-secondary">
          Assessment
        </span>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 space-y-10 overflow-y-auto p-6 pb-32 md:p-10">
        <section className="space-y-4 rounded-lg border border-gray-800 bg-card/50 p-5">
          <div className="flex items-center gap-2 text-secondary">
            <Tags size={18} />
            <h2 className="text-lg font-bold">읽으며 남긴 흐름</h2>
          </div>
          <div className="space-y-3">
            {paragraphs.map((_, idx) => {
              const keywords = splitKeywords(keywordInputs[idx] ?? "");
              return (
                <div key={idx} className="flex gap-3 text-sm">
                  <span className="w-10 shrink-0 font-bold text-gray-500">P{idx + 1}</span>
                  <span className="text-gray-300">
                    {keywords.length > 0 ? keywords.join(", ") : "키워드 미입력"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} className="text-secondary" />
            <h2 className="text-xl font-bold">확인 문제</h2>
          </div>

          {data.questions.map((q, qIdx) => (
            <div
              key={q.id}
              className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{ animationDelay: `${qIdx * 100}ms` }}
            >
              <p className="text-base font-bold leading-relaxed md:text-lg">
                <span className="mr-2 text-secondary">Q{qIdx + 1}.</span>
                {q.question}
              </p>
              <div className="space-y-3">
                {q.options.map((option, aIdx) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerChange(qIdx, aIdx)}
                    className={`w-full rounded-lg border p-4 text-left transition-all duration-200 md:p-5 ${
                      answers[qIdx] === aIdx
                        ? "border-secondary bg-secondary/10 text-secondary shadow-lg shadow-secondary/10 ring-1 ring-secondary/50"
                        : "border-gray-800 bg-card/50 hover:border-gray-600 hover:bg-gray-800/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                          answers[qIdx] === aIdx ? "border-secondary bg-secondary text-white" : "border-gray-700"
                        }`}
                      >
                        {aIdx + 1}
                      </span>
                      <span className="text-sm md:text-base">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent p-6 pt-12">
        <div className="pointer-events-auto mx-auto w-full max-w-2xl">
          <button
            onClick={() => onSubmit(buildFlowSummary(), answers)}
            disabled={!isFormValid || isLoading}
            className="w-full rounded-lg bg-secondary py-4 text-lg font-bold text-white shadow-2xl shadow-secondary/20 transition-all hover:bg-secondary/90 active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:shadow-none md:py-5"
          >
            {isLoading ? "AI 분석 중..." : "제출하고 결과 보기"}
          </button>
        </div>
      </div>
    </div>
  );
}
