import "@fontsource-variable/inter";
import React from "react";
import { Composition, continueRender, delayRender } from "remotion";
import { Episode, SingleScene } from "./Episode";
import { episodeFrames, episodes, sceneFrames } from "./data";
import { FPS, HEIGHT, WIDTH } from "./theme";

const fontHandle = delayRender("Chargement d'Inter");
Promise.all([
  document.fonts.load('200 40px "Inter Variable"'),
  document.fonts.load('300 40px "Inter Variable"'),
  document.fonts.load('400 40px "Inter Variable"'),
]).then(() => continueRender(fontHandle));

export const RemotionRoot: React.FC = () => (
  <>
    {episodes.map((episode) => (
      <React.Fragment key={episode.id}>
        <Composition
          id={`Episode-${episode.id}`}
          component={Episode}
          defaultProps={{ episode }}
          durationInFrames={episodeFrames(episode)}
          fps={FPS}
          width={WIDTH}
          height={HEIGHT}
        />
        {episode.scenes.map((scene) => (
          <Composition
            key={scene.id}
            id={`Scene-${scene.id}`}
            component={SingleScene}
            defaultProps={{ episode, scene }}
            durationInFrames={sceneFrames(scene.id)}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
          />
        ))}
      </React.Fragment>
    ))}
  </>
);
