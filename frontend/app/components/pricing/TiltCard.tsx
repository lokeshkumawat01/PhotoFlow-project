"use client";

import { useRef, useState } from "react";

export default function TiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("");
  const [isTouch] = useState(
    typeof window !== "undefined" && "ontouchstart" in window
  );

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isTouch || !ref.current) return; // touch devices: no tilt, avoids janky UX
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    setTransform(
      `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(6px)`
    );
  }

  function handleMouseLeave() {
    setTransform("perspective(700px) rotateY(0) rotateX(0)");
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transform,
        transition: "transform 0.15s ease",
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
}