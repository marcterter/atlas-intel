import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { PartTag } from "./S49";
import { CaseHeader, DataRecall, LetterQuestions } from "./S51";

const HEADER = "Une annonce commerciale de nouvelle puce";

// L'annonce (fictive) et le cours de bourse qui monte.
const Announcement: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const up = cues.s(2);
  const pts = [
    [1130, 560],
    [1200, 545],
    [1270, 565],
    [1340, 520],
    [1410, 530],
    [1480, 450],
    [1550, 400],
    [1620, 340],
  ];
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  return (
    <AbsoluteFill>
      <CaseHeader id="C3" title={HEADER} start={0} />
      <Svg>
        <DrawPath
          d={roundRectPath(280, 290, 700, 360, 18)}
          start={t}
          duration={0.9}
          stroke={COLORS.inkSoft}
        />
        <Icon
          name="chip"
          x={900}
          y={360}
          size={34}
          start={t + 8}
          color={COLORS.accent}
        />
        {/* Axes et courbe du titre */}
        <DrawPath
          d="M 1110 290 V 620 H 1660"
          start={t + 20}
          duration={0.8}
          stroke={COLORS.inkFaint}
        />
        <DrawPath
          d={d}
          start={up}
          duration={1.4}
          stroke={COLORS.accent}
          width={2.5}
        />
        <circle
          cx={1620}
          cy={340}
          r={7}
          fill={COLORS.accent}
          opacity={progress(frame, up + 1.4 * FPS, 0.3)}
        />
        <SvgText
          x={1385}
          y={660}
          text="le titre progresse"
          start={up + 10}
          size={26}
          color={COLORS.accent}
        />
      </Svg>
      <div style={{ position: "absolute", top: 320, left: 330, width: 620 }}>
        <FadeIn start={t + 4}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.warm,
              letterSpacing: "0.3em",
            }}
          >
            ANNONCE · EXEMPLE FICTIF
          </div>
        </FadeIn>
        <FadeIn start={t + 14} style={{ marginTop: 34 }}>
          <div style={{ ...textStyle(64, 200), color: COLORS.accent }}>
            +<Counter to={30} start={t + 14} duration={1.2} /> %{" "}
            <span style={{ ...textStyle(32, 300) }}>de transistors</span>
          </div>
        </FadeIn>
        <FadeIn start={cues.s(1, 3.6)} style={{ marginTop: 20 }}>
          <div style={{ ...textStyle(64, 200), color: COLORS.accent }}>
            +<Counter to={25} start={cues.s(1, 3.6)} duration={1.2} /> %{" "}
            <span style={{ ...textStyle(32, 300) }}>d’efficacité</span>
          </div>
        </FadeIn>
      </div>
      <Svg>
        <Icon
          name="magnifier"
          x={700}
          y={760}
          size={26}
          start={cues.s(3)}
          color={COLORS.warm}
        />
      </Svg>
      <FadeIn
        start={cues.s(3)}
        style={{ position: "absolute", top: 738, left: 750, width: 800 }}
      >
        <div style={{ ...textStyle(34, 300), color: COLORS.warm }}>
          Aucune autre information
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const Questions: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <CaseHeader id="C3" title={HEADER} start={cues.s(4)} />
      <DataRecall start={cues.s(4)}>
        « +30 % de transistors, +25 % d’efficacité » · le titre progresse · rien
        d’autre
      </DataRecall>
      <LetterQuestions
        items={[
          {
            s: 4,
            text: "Quelles informations demandes-tu pour définir précisément l’efficacité annoncée ?",
          },
          {
            s: 5,
            text: "Quels éléments techniques et industriels vérifies-tu avant d’en déduire une baisse du coût par token ?",
          },
          {
            s: 6,
            text: "Quel fournisseur indirect pourrait bénéficier du changement, par quel mécanisme, et avec quelle réserve ?",
          },
        ]}
      />
    </AbsoluteFill>
  );
};

const PROMPTS = [
  "Le mécanisme que je peux expliquer sans notes",
  "La notion que je confonds encore",
  "La question industrielle que je voudrais approfondir",
];

// Trois lignes d'auto-diagnostic à compléter.
const SelfCheck: React.FC = () => {
  const cues = useCues();
  const at = [0.4, 3.4, 6.4].map((d) => cues.s(8, d));
  return (
    <AbsoluteFill>
      <Title
        text="Ton auto-diagnostic"
        kicker="Avant la correction"
        start={cues.s(7)}
        top={140}
      />
      <Svg>
        <Icon
          name="pencil"
          x={300}
          y={330}
          size={30}
          start={cues.s(7, 1)}
          color={COLORS.accent}
        />
        {PROMPTS.map((p, i) => (
          <g key={p}>
            <SvgText
              x={380}
              y={340 + i * 160}
              text={`${i + 1}`}
              start={at[i]}
              size={36}
              weight={200}
              color={COLORS.accent}
            />
            <DrawPath
              d={`M 420 ${400 + i * 160} H 1640`}
              start={at[i] + 12}
              duration={1.4}
              stroke={COLORS.inkFaint}
              width={1.4}
            />
          </g>
        ))}
      </Svg>
      {PROMPTS.map((p, i) => (
        <FadeIn
          key={p}
          start={at[i]}
          style={{
            position: "absolute",
            top: 318 + i * 160,
            left: 430,
            width: 1200,
          }}
        >
          <div style={textStyle(34, 300)}>{p}&nbsp;:</div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Scène 52 — C3, lecture critique d'une annonce, puis auto-diagnostic.
export const S52: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(7)}>
        <PartTag index={2} start={0} />
      </Stage>
      <Stage from={0} to={cues.s(4)}>
        <Announcement />
      </Stage>
      <Stage from={cues.s(4)} to={cues.s(7)}>
        <Questions />
      </Stage>
      <Stage from={cues.s(7)}>
        <SelfCheck />
      </Stage>
    </AbsoluteFill>
  );
};
