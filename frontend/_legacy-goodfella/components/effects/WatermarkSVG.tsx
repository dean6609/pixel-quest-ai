"use client";

export default function WatermarkSVG() {
  const letters = "Good Fella".split("");

  return (
    <div style={{ overflow: "hidden", marginTop: "2rem" }}>
      <svg
        viewBox="0 0 1727 314"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto" }}
      >
        {letters.map((letter, index) => (
          <g
            key={index}
            className="goodfella-letter-animated"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <text
              x={index * 170}
              y="250"
              fill="var(--color-foreground-muted)"
              opacity="0.1"
              fontSize="280"
              fontFamily="var(--font-sans)"
              fontWeight="800"
            >
              {letter}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
