"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  createPrompt,
  deletePrompt,
  type PromptDTO,
} from "./actions/prompt-actions";
// 🚚 1. 아까 고용한 배달원(Supabase 액션)을 불러옵니다!
import { savePromptToSupabase } from "./actions/supabase-actions";

// formatDateKR 함수 정의 (클라이언트/서버 모두 안전하게 사용)
function formatDateKR(iso: string): string {
  try {
    if (!iso) return "";
    return new Date(iso).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// 클라이언트에서만 안전하게 날짜를 렌더하는 컴포넌트
function ClientOnlyDate({ iso }: { iso: string | Date }) {
  const [dateStr, setDateStr] = useState<string>("");

  useEffect(() => {
    const s =
      typeof iso === "string" ? iso : iso instanceof Date ? iso.toISOString() : "";
    setDateStr(formatDateKR(s));
  }, [iso]);

  return <span suppressHydrationWarning>{dateStr}</span>;
}

type PromptUIProps = {
  initialPrompts: PromptDTO[];
};

export default function PromptUI({ initialPrompts }: PromptUIProps) {
  const [role, setRole] = useState("");
  const [task, setTask] = useState("");
  const [result, setResult] = useState("");
  const [prompts, setPrompts] = useState<PromptDTO[]>(initialPrompts);

  const [previewCopyStatus, setPreviewCopyStatus] = useState<"idle" | "copied">("idle");
  const previewTimeoutRef = useRef<number | null>(null);

  const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);
  const copiedPromptTimeoutRef = useRef<number | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingPromptId, setDeletingPromptId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      if (copiedPromptTimeoutRef.current) clearTimeout(copiedPromptTimeoutRef.current);
    };
  }, []);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handlePreviewCopy = async () => {
    if (!result) return;
    const ok = await handleCopy(result);
    if (!ok) return;

    setPreviewCopyStatus("copied");
    if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    previewTimeoutRef.current = window.setTimeout(() => {
      setPreviewCopyStatus("idle");
    }, 2000);
  };

  const handlePromptCopy = async (prompt: PromptDTO) => {
    const ok = await handleCopy(prompt.result);
    if (!ok) return;

    setCopiedPromptId(prompt.id);
    if (copiedPromptTimeoutRef.current) {
      clearTimeout(copiedPromptTimeoutRef.current);
    }
    copiedPromptTimeoutRef.current = window.setTimeout(() => {
      setCopiedPromptId(null);
    }, 2000);
  };

  const handlePromptDelete = async (prompt: PromptDTO) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    setDeletingPromptId(prompt.id);
    try {
      await deletePrompt(String(prompt.id));
      setPrompts((prev) => prev.filter((x) => x.id !== prompt.id));
    } catch {
      setError("삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setDeletingPromptId(null);
    }
  };

  const handleGenerate = async () => {
    setError(null);

    const roleTrim = role.trim();
    const taskTrim = task.trim();
    if (!roleTrim || !taskTrim) return;

    setIsGenerating(true);
    try {
      // (기존) 로컬 DB나 AI를 통해 프롬프트를 생성하고 저장하는 부분
      const saved = await createPrompt(roleTrim, taskTrim);

      setResult(saved.result);
      setPrompts((prev) => [saved, ...prev]);

      // 🚀 2. 여기에 Supabase 배달원을 몰래 추가 투입합니다!
      // AI가 만들어준 결과물(saved.result)을 Supabase 창고로도 쏴줍니다.
      const supabaseResult = await savePromptToSupabase(saved.result);
      
      // 배달이 잘 갔는지 몰래 확인 (원하시면 지워도 되는 줄입니다)
      if (supabaseResult.success) {
        console.log("Supabase 창고에도 안전하게 복사본을 넣었습니다!");
      } else {
        console.error("Supabase 창고 저장 실패:", supabaseResult.message);
      }

    } catch (err) {
      console.error(err);
      setError("생성 또는 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sortedPrompts = useMemo(() => {
    return [...prompts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [prompts]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 flex flex-col items-center px-4 py-10 font-sans">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <div className="bg-zinc-900/80 backdrop-blur-lg rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-lg mx-auto p-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-zinc-100 mb-2 drop-shadow-lg tracking-tight">
            ✨ AI 프롬프트 마스터
          </h1>
          <p className="text-zinc-400 text-center mb-8">
            원하는 역할과 작업을 입력하면,
            <br className="sm:hidden" />
            완벽한 프롬프트를 쉽게 만들어드립니다.
          </p>

          <div className="w-full flex flex-col gap-4 mb-8">
            <input
              className="w-full px-4 py-3 rounded-lg bg-zinc-800 text-zinc-200 placeholder-zinc-500 border border-zinc-700 focus:ring-2 focus:ring-indigo-500 transition outline-none"
              type="text"
              placeholder="어떤 역할을 부여할까요? (예: 마케터, 프론트엔드 개발자)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            />
            <textarea
              className="w-full h-28 px-4 py-3 rounded-lg bg-zinc-800 text-zinc-200 placeholder-zinc-500 border border-zinc-700 focus:ring-2 focus:ring-indigo-500 transition outline-none resize-none"
              placeholder="어떤 작업을 지시할까요? (예: Next.js로 블로그 만드는 코드 짜줘)"
              value={task}
              onChange={(e) => setTask(e.target.value)}
            />
          </div>

          <button
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-zinc-50 font-bold text-lg shadow-lg transition-all hover:from-pink-500 hover:to-indigo-500 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-400/50 mb-6 disabled:opacity-60 disabled:hover:scale-100"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "저장 중... 🔄" : "완벽한 프롬프트 생성하기 🚀"}
          </button>

          {error && (
            <div className="w-full mb-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              {error}
            </div>
          )}

          {result && (
            <div className="relative w-full mt-2 bg-gradient-to-r from-zinc-800 via-zinc-850 to-zinc-900 border border-zinc-700 rounded-xl p-6 text-zinc-100 shadow-inner text-base whitespace-pre-line min-h-[60px] animate-fade-in">
              <button
                className="absolute top-3 right-3 text-xs px-3 py-1 rounded-md bg-zinc-700/70 text-zinc-300 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                onClick={handlePreviewCopy}
                disabled={previewCopyStatus === "copied"}
                aria-label="Copy to clipboard"
              >
                {previewCopyStatus === "copied" ? "복사 완료! ✅" : "복사하기"}
              </button>
              {result}
            </div>
          )}
        </div>

        <section className="w-full bg-zinc-900/50 backdrop-blur-lg rounded-2xl shadow-2xl border border-zinc-700/50 p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 drop-shadow">
              📚 내 프롬프트 보관함
            </h2>
            <div className="text-sm text-zinc-400">
              총 {sortedPrompts.length}개
            </div>
          </div>

          {sortedPrompts.length === 0 ? (
            <div className="text-zinc-400 text-sm leading-relaxed">
              아직 저장된 프롬프트가 없어요. 위에서 생성하면 바로 이곳에 쌓입니다.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {sortedPrompts.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="relative p-[1px] rounded-2xl bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40"
                  >
                    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-700/60 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-indigo-200 truncate">
                            {p.role}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">
                            <ClientOnlyDate iso={p.createdAt} />
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            className="text-xs px-2 py-1 rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all focus:outline-none focus:ring-2 focus:ring-red-400/40 disabled:opacity-50 disabled:pointer-events-none"
                            onClick={() => handlePromptDelete(p)}
                            disabled={deletingPromptId === p.id}
                            aria-label="프롬프트 삭제"
                          >
                            {deletingPromptId === p.id ? "삭제 중..." : "🗑️ 삭제"}
                          </button>
                          <button
                            type="button"
                            className="shrink-0 text-xs px-3 py-1 rounded-md bg-zinc-700/70 text-zinc-300 hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 disabled:opacity-70"
                            onClick={() => handlePromptCopy(p)}
                            disabled={copiedPromptId === p.id || deletingPromptId === p.id}
                            aria-label="Copy prompt result"
                          >
                            {copiedPromptId === p.id ? "복사 완료! ✅" : "복사하기"}
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-zinc-400 whitespace-pre-line">
                        <span className="text-zinc-300/90 font-medium">Task:</span>{" "}
                        {p.task.length > 80 ? p.task.slice(0, 80) + "..." : p.task}
                      </div>

                      <div className="mt-3 text-zinc-100 text-sm whitespace-pre-line overflow-auto max-h-44 leading-relaxed">
                        {p.result}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}