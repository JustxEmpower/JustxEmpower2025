import React from "react";

/**
 * Animated Living Codex logo — two overlapping circles (vesica piscis)
 * with orbiting dashed rings and a breathing leaf at the center.
 */
export default function CodexLogoLoader({ size = 80 }: { size?: number }) {
  const r = size * 0.34;
  const cx1 = size * 0.38;
  const cx2 = size * 0.62;
  const cy = size * 0.5;
  const stroke = "rgba(160,120,80,0.55)";
  const leaf = "rgba(160,120,80,0.7)";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ animation: "cx-logo-glow 3s ease-in-out infinite" }}
    >
      {/* Left circle — slow clockwise orbit */}
      <circle
        cx={cx1} cy={cy} r={r}
        fill="none" stroke={stroke} strokeWidth={1.2}
        style={{
          transformOrigin: `${size / 2}px ${cy}px`,
          animation: "cx-logo-rotate-cw 12s linear infinite",
        }}
        strokeDasharray="4 3"
      />
      {/* Right circle — slow counter-clockwise orbit */}
      <circle
        cx={cx2} cy={cy} r={r}
        fill="none" stroke={stroke} strokeWidth={1.2}
        style={{
          transformOrigin: `${size / 2}px ${cy}px`,
          animation: "cx-logo-rotate-ccw 12s linear infinite",
        }}
        strokeDasharray="4 3"
      />
      {/* Solid overlapping rings (breathe) */}
      <g style={{ animation: "cx-logo-breathe 4s ease-in-out infinite" }}>
        <circle cx={cx1} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={0.8} />
        <circle cx={cx2} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={0.8} />
      </g>
      {/* Vesica piscis leaf — the sacred intersection */}
      <path
        d={`M ${size / 2} ${cy - r * 0.82}
            Q ${cx1 + r * 0.15} ${cy} ${size / 2} ${cy + r * 0.82}
            Q ${cx2 - r * 0.15} ${cy} ${size / 2} ${cy - r * 0.82} Z`}
        fill={leaf}
        style={{ animation: "cx-logo-leaf-pulse 3s ease-in-out infinite" }}
      />
    </svg>
  );
}
