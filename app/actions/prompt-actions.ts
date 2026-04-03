"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type PromptDTO = {
  id: number;
  role: string;
  task: string;
  result: string;
  createdAt: string;
};

// 📚 프롬프트 목록 불러오기
export async function listPrompts(): Promise<PromptDTO[]> {
  const prompts = await prisma.prompt.findMany({
    orderBy: { createdAt: "desc" },
  });
  
  return prompts.map((p) => ({
    id: p.id,
    role: p.role,
    task: p.task,
    result: p.result,
    createdAt: p.createdAt.toISOString(),
  }));
}

// 🚀 프롬프트 생성 (완벽 방어 코드 적용)
export async function createPrompt(role: string, task: string): Promise<PromptDTO> {
  try {
    // 🔥 [핵심 조치 1] 버튼 누를 때마다 실시간으로 환경변수 읽기
    // 🔥 [핵심 조치 2] .trim()을 사용해 눈에 안 보이는 공백/엔터 찌꺼기 완벽 제거
    const apiKey = (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();

    // 터미널에 진짜 글자 수가 몇 개인지 출력해 봅니다. (보통 39글자입니다)
    console.log(`\n🔍 [디버그] 현재 읽어온 API 키 길이: ${apiKey.length}글자`);

    if (apiKey.length === 0) {
      throw new Error("API 키가 비어있습니다. .env 파일을 다시 확인해주세요!");
    }

    // 여기서 AI 엔진을 안전하게 초기화합니다.
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const promptText = `당신은 세계 최고의 ${role}입니다. 다음 임무를 완벽하게 수행해 주세요: ${task}`;

    const aiResult = await model.generateContent(promptText);
    const response = await aiResult.response;
    const text = response.text();

    const saved = await prisma.prompt.create({
      data: {
        role,
        task,
        result: text,
      },
    });

    return {
      id: saved.id,
      role: saved.role,
      task: saved.task,
      result: saved.result,
      createdAt: saved.createdAt.toISOString(),
    };
  } catch (error: any) {
    console.error("--- 🚨 AI API ERROR START 🚨 ---");
    console.error(error.message || error);
    console.error("--- 🚨 REAL ERROR END 🚨 ---");
    throw new Error("AI generation failed");
  }
}

// 🗑️ 프롬프트 삭제
export async function deletePrompt(id: string) {
  await prisma.prompt.delete({
    where: { id: Number(id) },
  });
  return { success: true };
}