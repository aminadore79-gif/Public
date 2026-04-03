"use client";

import { useState } from "react";

export default function ImageGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsLoading(true);
    setImageUrl(""); // 기존 그림 지우기

    // 🔥 [바이브 코딩 치트키] 열쇠 없이 바로 그림을 그려주는 오픈소스 AI 호출!
    // 영어로 입력하면 훨씬 더 퀄리티가 좋습니다.
    const encodedPrompt = encodeURIComponent(prompt);
    const aiImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&nologo=true`;

    // 그림이 완성될 때까지 기다렸다가 화면에 띄우는 꼼수 로직
    const image = new Image();
    image.src = aiImageUrl;
    image.onload = () => {
      setImageUrl(aiImageUrl);
      setIsLoading(false);
    };
  };

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-8">
      {/* 헤더 섹션 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
          AI 마법의 붓 🎨
        </h1>
        <p className="text-gray-500">
          영어로 상상하는 모습을 적어주세요. (예: A cute cat riding a skateboard in space)
        </p>
      </div>

      {/* 입력 섹션 */}
      <div className="flex gap-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="영어로 입력해 보세요!"
          className="flex-1 p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt}
          className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
        >
          {isLoading ? "그리는 중... 🖌️" : "그림 생성!"}
        </button>
      </div>

      {/* 결과물(캔버스) 섹션 */}
      <div className="w-full aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative shadow-inner">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-purple-600 font-bold animate-pulse">AI가 물감을 섞고 있습니다...</p>
          </div>
        )}
        
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt="AI가 생성한 이미지"
            className="w-full h-full object-cover"
          />
        ) : (
          !isLoading && <p className="text-gray-400 text-lg">이곳에 마법 같은 그림이 나타납니다!</p>
        )}
      </div>
    </div>
  );
}

