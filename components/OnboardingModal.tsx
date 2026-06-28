"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  {
    title: "Vocabin 100% 활용하기 💡",
    description: "본격적인 학습 전에, 남들은 잘 모르는 효율적인 단어 암기 꿀팁을 알려드릴게요!",
    icon: "🚀",
  },
  {
    title: "스마트한 SM-2 알고리즘 🧠",
    description: "주차별 단어 세트에 얽매일 필요 없습니다! 플래시카드와 스피드런은 전체 단어 중 '가장 복습이 시급한 단어'를 SM-2 알고리즘으로 자동 추출해 줍니다.",
    icon: "✨",
  },
  {
    title: "키보드로 빠르게 학습하세요 ⌨️",
    description: "플래시카드 모드에서 마우스 클릭 없이 키보드만으로 초고속 학습이 가능합니다.",
    features: [
      { label: "Space / ↑", desc: "단어 카드 뒤집기" },
      { label: "← 방향키", desc: "몰라요 (오답 체크)" },
      { label: "→ 방향키", desc: "알아요 (정답 체크)" },
    ],
    icon: "⚡",
  },
  {
    title: "취약 단어는 자동 수집 🎯",
    description: "플래시카드나 스피드런에서 3번 이상 틀린 단어는 자동으로 '취약 단어' 메뉴에 수집됩니다. 복습 효율을 극대화해보세요.",
    icon: "📊",
  },
  {
    title: "스펠링은 스피드런 모드로 ⏱️",
    description: "눈으로만 보면 스펠링을 놓치기 쉽습니다. 직접 타이핑하며 정확한 철자를 외우고 정답률을 올려보세요!",
    icon: "🔥",
  },
];

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const hasSeen = localStorage.getItem("vocabin_onboarding_seen");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  if (!isMounted || !isOpen) return null;

  const handleClose = () => {
    localStorage.setItem("vocabin_onboarding_seen", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md fade-in">
      <div className="glass-card w-full max-w-[390px] rounded-3xl shadow-2xl overflow-hidden border-white/[0.06] bg-[#0E111E]">
        <div className="px-6 pt-8 pb-6 relative">
          {/* Skip Button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 text-xs font-bold text-slate-500 hover:text-slate-350 transition-colors cursor-pointer"
          >
            건너뛰기
          </button>

          {/* Icon */}
          <div className="w-16 h-16 bg-white/[0.02] border border-white/[0.08] rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto shadow-inner">
            {slide.icon}
          </div>

          {/* Text Content */}
          <div className="text-center min-h-[140px]">
            <h2 className="text-lg font-extrabold text-foreground mb-3 tracking-tight">{slide.title}</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold px-2">{slide.description}</p>
            
            {/* Features (if any) */}
            {slide.features && (
              <div className="mt-5 space-y-2 text-left bg-slate-950/40 rounded-2xl p-4 border border-white/[0.04]">
                {slide.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="font-mono px-2 py-1 bg-slate-900 border border-white/[0.08] rounded-lg text-[10px] font-bold text-slate-300 min-w-[76px] text-center shadow-inner">
                      {feature.label}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{feature.desc}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4.5 bg-slate-950/20 flex items-center justify-between border-t border-white/[0.04]">
          <div className="flex gap-1.5">
            {SLIDES.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-5 bg-primary" : "w-1.5 bg-slate-800"
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl shadow-lg shadow-primary/10 transition-all spring-active"
          >
            {currentSlide === SLIDES.length - 1 ? "시작하기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
