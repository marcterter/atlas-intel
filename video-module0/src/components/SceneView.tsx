import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { SceneDef, getTiming } from "../data";
import { Fallback, visuals } from "../scenes";
import { FPS, HEAD_S } from "../theme";
import { ChapterTag } from "./ChapterTag";
import { CueContext, Cues } from "./motion";
import { Subtitles } from "./Subtitles";

export const SceneView: React.FC<{ scene: SceneDef }> = ({ scene }) => {
  const timing = getTiming(scene.id);
  const offset = Math.round(HEAD_S * FPS);
  const Visual = visuals[scene.id] ?? Fallback;

  const startOf = (i: number, delayS: number) => offset + (timing.sentences[i].start + delayS) * FPS;
  const cues: Cues = {
    s: (i, delayS = 0) => startOf(i, delayS),
    beat: (b, delayS = 0) => startOf(scene.sentences.findIndex((x) => x.beat === b), delayS),
    end: offset + timing.duration * FPS,
  };

  return (
    <AbsoluteFill>
      <Sequence from={offset} layout="none">
        <Audio src={staticFile(`audio/${scene.id}.wav`)} />
      </Sequence>
      <CueContext.Provider value={cues}>
        <Visual scene={scene} />
      </CueContext.Provider>
      <ChapterTag num={scene.chapter} title={scene.chapterTitle.replace(/'/g, "’")} />
      <Subtitles sentences={scene.sentences} timing={timing} offset={offset} />
    </AbsoluteFill>
  );
};
