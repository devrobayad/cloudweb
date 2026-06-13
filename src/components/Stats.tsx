import React, { useState, useEffect, useRef } from "react";
import { dataStore, StatItem } from "../utils/dataStore";
import ScrollReveal from "./ScrollReveal";

function parseValue(valueStr: string) {
  // Find the first digit and match any digits, commas, or dots as the number group
  const match = valueStr.match(/([^\d]*)([\d,]+)([^\d]*)/);
  if (!match) return { target: 0, prefix: "", suffix: valueStr };
  
  const prefix = match[1] || "";
  const numStr = match[2] || "";
  const suffix = match[3] || "";
  
  const target = parseInt(numStr.replace(/,/g, ""), 10) || 0;
  return { target, prefix, suffix };
}

function AnimatedCounter({ value }: { value: string }) {
  const { target, prefix, suffix } = parseValue(value);
  const [count, setCount] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isInView || target === 0) {
      return;
    }

    const duration = 1500; // 1.5 seconds animation duration
    const startTime = performance.now();
    let animationFrameId: number;

    const updateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      const current = Math.floor(easeProgress * target);

      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      } else {
        setCount(target);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, target]);

  // Use a div instead of a span to bypass global index.css `span { font-size: 14px !important; }` rule
  if (target === 0 && value) {
    return (
      <div 
        ref={elementRef} 
        style={{ display: "inline-block", fontSize: "30px" }}
      >
        {value}
      </div>
    );
  }

  return (
    <div 
      ref={elementRef} 
      style={{ display: "inline-block", fontSize: "30px" }}
    >
      {prefix}
      {isInView ? count : "0"}
      {suffix}
    </div>
  );
}

export default function Stats() {
  const [stats, setStats] = useState<StatItem[]>(() => dataStore.getDisplayStats());

  useEffect(() => {
    const handleUpdate = () => {
      setStats(dataStore.getDisplayStats());
    };
    window.addEventListener("datastore-update", handleUpdate);
    return () => window.removeEventListener("datastore-update", handleUpdate);
  }, []);

  if (!stats || stats.length === 0) return null;

  return (
    <section className="bg-[#0a0f1d] py-16 md:py-20 border-t border-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <ScrollReveal
              key={stat.id || idx}
              direction="up"
              duration={0.5}
              delay={idx * 0.1}
            >
              <div
                className="bg-[#141b2d] rounded-2xl p-8 py-10 flex flex-col items-center justify-center text-center border border-slate-800/20 hover:border-indigo-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl select-none group"
              >
                {/* Huge Bold Centered Number */}
                <div 
                  style={{ fontSize: "30px" }}
                  className="font-black text-indigo-500 tracking-tight leading-none group-hover:scale-[1.03] transition-transform duration-300"
                >
                  <AnimatedCounter value={stat.value} />
                </div>
                
                {/* Centered Descriptive Label */}
                <div className="text-slate-300 font-semibold text-sm md:text-[15px] mt-4 tracking-wide group-hover:text-white transition-colors">
                  {stat.label}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
