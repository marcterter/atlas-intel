import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneDef, getTiming } from "../data";
import { visuals } from "../scenes";
import { FPS, HEAD_S } from "../theme";
import { CueContext } from "./motion";
import { Subtitles } from "./Subtitles";

export const SceneView: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const timing = getTiming(scene.id);
  const offset = Math.round(HEAD_S * FPS);
  const Visual = visuals[scene.visual];
  if (!Visual) throw new Error(`Visuel inconnu : ${scene.visual}`);

  const cues = {
    at: (i: number, delayS = 0) => offset + (timing.sentences[i].start + delayS) * FPS,
  };

  return (
    <AbsoluteFill>
      <Sequence from={offset} layout="none">
        <Audio src={staticFile(`audio/${scene.id}.wav`)} />
      </Sequence>
      <CueContext.Provider value={cues}>
        <Visual />
      </CueContext.Provider>
      <Subtitles sentences={scene.sentences} timing={timing} offset={offset} />
    </AbsoluteFill>
  );
};
