import { fade } from "@remotion/transitions/fade";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "./components/Background";
import { ChapterTag } from "./components/ChapterTag";
import { SceneView } from "./components/SceneView";
import { EpisodeDef, SceneDef, sceneFrames } from "./data";
import { TRANSITION_FRAMES } from "./theme";

const FadeFromToBlack: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, 15, durationInFrames - 20, durationInFrames - 1],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ backgroundColor: "#000", opacity }} />;
};

const Frame: React.FC<{ episode: EpisodeDef; children: React.ReactNode }> = ({
  episode,
  children,
}) => (
  <AbsoluteFill>
    <Background />
    {children}
    <ChapterTag num={episode.num} title={episode.title} />
    <FadeFromToBlack />
  </AbsoluteFill>
);

export const Episode: React.FC<{ episode: EpisodeDef }> = ({ episode }) => (
  <Frame episode={episode}>
    <TransitionSeries>
      {episode.scenes.map((scene, i) => (
        <React.Fragment key={scene.id}>
          {i > 0 && (
            <TransitionSeries.Transition
              presentation={fade()}
              timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
            />
          )}
          <TransitionSeries.Sequence durationInFrames={sceneFrames(scene.id)}>
            <SceneView scene={scene} />
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
    </TransitionSeries>
  </Frame>
);

// Une scène isolée, habillée comme dans l'épisode (pour validation).
export const SingleScene: React.FC<{ episode: EpisodeDef; scene: SceneDef }> = ({
  episode,
  scene,
}) => (
  <Frame episode={episode}>
    <SceneView scene={scene} />
  </Frame>
);
