import React from "react";
import { COLORS, FONT } from "../theme";

export const ChapterTag: React.FC<{ num: string; title: string }> = ({
  num,
  title,
}) => (
  <div
    style={{
      position: "absolute",
      top: 56,
      left: 72,
      fontFamily: FONT,
      fontWeight: 300,
      fontSize: 22,
      letterSpacing: "0.06em",
      color: COLORS.inkSoft,
      display: "flex",
      gap: 14,
    }}
  >
    <span style={{ color: COLORS.accent, fontWeight: 400 }}>{num}</span>
    <span style={{ color: COLORS.inkFaint }}>|</span>
    <span>{title}</span>
  </div>
);
