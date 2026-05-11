"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface TopicSelectorProps {
  onSelect: (topic: string) => void;
  isLoading: boolean;
}

export default function TopicSelector({ onSelect, isLoading }: TopicSelectorProps) {
  const [topic, setTopic] = useState("");

  const suggestedTopics = ["경제와 인플레이션", "인공지능의 미래", "양자 역학 기초", "직장 내 커뮤니케이션", "현대 철학의 흐름"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSelect(topic);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-primary">어떤 주제를 읽어볼까요?</h1>
        <p className="text-gray-400">성인 수준의 전문적인 지문을 생성해 드립니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="관심 있는 주제를 입력하세요 (예: 반도체 공정)"
          className="w-full bg-card border border-gray-700 rounded-2xl py-5 pl-5 pr-16 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-base"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-primary text-white rounded-xl disabled:opacity-50 transition-all active:scale-90 z-20 shadow-lg"
        >
          <Search size={24} />
        </button>
      </form>

      <div className="space-y-4">
        <p className="text-sm text-gray-500 font-medium ml-1">추천 주제</p>
        <div className="flex flex-wrap gap-3">
          {suggestedTopics.map((t) => (
            <button
              key={t}
              onClick={() => onSelect(t)}
              disabled={isLoading}
              className="px-5 py-3 bg-gray-800 hover:bg-gray-700 active:bg-gray-600 text-sm rounded-2xl border border-gray-700 transition-all active:scale-95 touch-manipulation cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
