import React from "react";
import { AbsoluteFill } from "remotion";
import { FadeIn, textStyle, useCues } from "../components/motion";
import { SceneDef } from "../data";

// Titre seul, pour les scènes dont le visuel n'est pas encore écrit.
export const Fallback: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const cues = useCues();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <FadeIn start={cues.s(0)}>
        <div style={textStyle(56, 200)}>{scene.title.replace(/'/g, "’")}</div>
      </FadeIn>
    </AbsoluteFill>
  );
};
