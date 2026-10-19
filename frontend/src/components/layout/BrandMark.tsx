interface BrandMarkProps {
  tone?: "light" | "dark";
  size?: number;
}

export default function BrandMark({ tone = "dark", size = 28 }: BrandMarkProps) {
  const text = tone === "dark" ? "#0B1220" : "#ffffff";

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M16 3L28 12V16L16 7L4 16V12L16 3Z" fill="#F59E0B" />
        <path d="M8 15L16 9L24 15V27H8V15Z" fill="#F59E0B" fillOpacity="0.9" />
        <path d="M13 18H19V27H13V18Z" fill={tone === "dark" ? "#ffffff" : "#0B1220"} />
        <rect x="6" y="27" width="20" height="2.5" rx="1" fill="#F59E0B" />
      </svg>
      <span style={{ fontSize: size * 0.72, fontWeight: 800, letterSpacing: "-0.5px", color: text, lineHeight: 1 }}>
        Makaan<span style={{ color: "#F59E0B" }}>o</span>
      </span>
    </span>
  );
}
