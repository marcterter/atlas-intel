import narration from "../narration/module0.json";
import timingsJson from "./generated/timings.json";
import { FPS, HEAD_S, TAIL_S, TRANSITION_FRAMES } from "./theme";

export type Sentence = { text: string; beat: number; say?: string };
export type SceneDef = {
  id: string;
  chapter: string;
  chapterTitle: string;
  title: string;
  sentences: Sentence[];
};
export type EpisodeDef = {
  id: string;
  num: string;
  title: string;
  slug: string;
  scenes: SceneDef[];
};
export type SceneTiming = {
  duration: number;
  sentences: { start: number; end: number }[];
};

export const episodes = narration.episodes as EpisodeDef[];
const timings = timingsJson as Record<string, SceneTiming>;

export const hasTiming = (sceneId: string) => sceneId in timings;

export const getTiming = (sceneId: string): SceneTiming => {
  const t = timings[sceneId];
  if (!t) {
    throw new Error(`Pas d'audio pour ${sceneId} : lancer tools/tts.py`);
  }
  return t;
};

export const sceneFrames = (sceneId: string) =>
  Math.ceil((HEAD_S + getTiming(sceneId).duration + TAIL_S) * FPS);

export const episodeFrames = (ep: EpisodeDef) =>
  ep.scenes.reduce((sum, s) => sum + sceneFrames(s.id), 0) -
  TRANSITION_FRAMES * (ep.scenes.length - 1);

export const findScene = (sceneId: string) => {
  for (const ep of episodes) {
    const scene = ep.scenes.find((s) => s.id === sceneId);
    if (scene) return { episode: ep, scene };
  }
  throw new Error(`Scène inconnue : ${sceneId}`);
};
