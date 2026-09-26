import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Bullets, Svg } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";
import { PartIntro, PartTag, QuestionDots } from "./S42";

// Compteur à la française, séparateur de milliers dès 1 000.
const Num: React.FC<{
  to: number;
  start: number;
  decimals?: number;
  duration?: number;
}> = ({ to, start, decimals = 0, duration = 1.2 }) => {
  const frame = useCurrentFrame();
  const v = to * progress(frame, start, duration);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {v.toLocaleString("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
};

type Tile = {
  label: string;
  to: number;
  unit: string;
  decimals?: number;
  at: number;
};

// Rangée de tuiles d'hypothèses dont les valeurs s'incrémentent.
const Tiles: React.FC<{ tiles: Tile[]; y?: number }> = ({ tiles, y = 290 }) => {
  const w = tiles.length === 3 ? 440 : 360;
  const gap = 40;
  const x0 = 960 - (tiles.length * w + (tiles.length - 1) * gap) / 2;
  return (
    <AbsoluteFill>
      <Svg>
        {tiles.map((t, i) => (
          <DrawPath
            key={t.label}
            d={roundRectPath(x0 + i * (w + gap), y, w, 160, 14)}
            start={t.at - 6}
            duration={0.6}
            stroke={COLORS.inkSoft}
            width={1.4}
          />
        ))}
      </Svg>
      {tiles.map((t, i) => (
        <FadeIn
          key={t.label}
          start={t.at}
          style={{
            position: "absolute",
            top: y + 22,
            left: x0 + i * (w + gap),
            width: w,
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(60, 200), color: COLORS.accent }}>
            <Num to={t.to} start={t.at} decimals={t.decimals} />
            <span style={{ fontSize: 34, color: COLORS.ink }}> {t.unit}</span>
          </div>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.inkSoft,
              letterSpacing: "0.2em",
              marginTop: 10,
            }}
          >
            {t.label.toUpperCase()}
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

const CaseHeader: React.FC<{ id: string; title: string; start: number }> = ({
  id,
  title,
  start,
}) => (
  <FadeIn
    start={start}
    style={{
      position: "absolute",
      top: 165,
      width: "100%",
      textAlign: "center",
    }}
  >
    <div style={textStyle(46, 200)}>
      <span style={{ color: COLORS.accent }}>{id}</span>
      <span style={{ color: COLORS.inkSoft }}> · </span>
      {title}
      <span
        style={{
          ...textStyle(22, 500),
          color: COLORS.warm,
          letterSpacing: "0.25em",
          marginLeft: 26,
        }}
      >
        15 POINTS
      </span>
    </div>
  </FadeIn>
);

const Label: React.FC<{ start: number; text: string; top: number }> = ({
  start,
  text,
  top,
}) => (
  <FadeIn start={start} style={{ position: "absolute", top, left: 300 }}>
    <div
      style={{
        ...textStyle(22, 500),
        color: COLORS.inkSoft,
        letterSpacing: "0.3em",
      }}
    >
      {text}
    </div>
  </FadeIn>
);

// Scène 44 — Partie C : deux cas pratiques chiffrés (énoncés seulement).
export const S44: React.FC = () => {
  const cues = useCues();
  const c1Tiles: Tile[] = [
    { label: "Puissance totale", to: 24, unit: "MW", at: cues.s(2, 2.2) },
    { label: "PUE", to: 1.2, unit: "", decimals: 2, at: cues.s(2, 4.2) },
    { label: "Par rack", to: 125, unit: "kW", at: cues.s(2, 5.8) },
  ];
  const c2Tiles: Tile[] = [
    { label: "Racks livrés", to: 2000, unit: "", at: cues.s(9, 1.6) },
    { label: "Modules / rack", to: 32, unit: "", at: cues.s(9, 3.6) },
    { label: "ASP par module", to: 500, unit: "€", at: cues.s(9, 5.6) },
    { label: "Part du fournisseur", to: 40, unit: "%", at: cues.s(9, 8.2) },
  ];
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(1)}>
        <PartIntro
          index={2}
          title="Cas pratiques analyste"
          start={0}
          perQuestion="15 points par cas"
        />
      </Stage>
      <Stage from={cues.s(1)}>
        <PartTag index={2} start={cues.s(1)} />
        <QuestionDots ids={["C1", "C2"]} starts={[cues.s(1), cues.s(8)]} />
      </Stage>

      {/* C1 — Du site aux racks */}
      <Stage from={cues.s(1)} to={cues.s(8)}>
        <CaseHeader id="C1" title="Du site aux racks" start={cues.s(1)} />
        <Tiles tiles={c1Tiles} />
        <Stage from={cues.s(3)} to={cues.s(5)}>
          <Label start={cues.s(3)} top={510} text="HYPOTHÈSES DE CALCUL" />
          <Bullets
            top={560}
            left={300}
            size={32}
            dimPast={false}
            starts={[cues.s(3), cues.s(4)]}
            items={[
              "Toute la puissance informatique est affectée aux racks.",
              "Le rapport PUE est supposé applicable au point de fonctionnement étudié.",
            ]}
          />
        </Stage>
        <Stage from={cues.s(5)}>
          <Label start={cues.s(5)} top={510} text="À FAIRE" />
          <Bullets
            top={560}
            left={300}
            size={32}
            numbered
            dimPast={false}
            starts={[cues.s(5), cues.s(6), cues.s(7)]}
            items={[
              "Calcule la puissance informatique disponible.",
              "Calcule le nombre théorique de racks.",
              "Donne deux raisons pour lesquelles le nombre réellement exploitable pourrait être inférieur.",
            ]}
          />
        </Stage>
      </Stage>

      {/* C2 — Du composant aux revenus */}
      <Stage from={cues.s(8)}>
        <CaseHeader
          id="C2"
          title="Du composant aux revenus"
          start={cues.s(8)}
        />
        <FadeIn
          start={cues.s(9)}
          style={{
            position: "absolute",
            top: 250,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.warm,
              letterSpacing: "0.3em",
            }}
          >
            HYPOTHÈSES FICTIVES
          </div>
        </FadeIn>
        <Tiles tiles={c2Tiles} y={295} />
        <Bullets
          top={500}
          left={300}
          size={30}
          numbered
          dimPast={false}
          starts={[cues.s(10), cues.s(11), cues.s(12), cues.s(13)]}
          items={[
            "Calcule le nombre total de modules.",
            "Calcule la valeur totale des modules.",
            "Calcule le chiffre d’affaires du fournisseur.",
            "Explique pourquoi ce chiffre n’est pas son bénéfice et n’est pas automatiquement récurrent chaque année.",
          ]}
        />
      </Stage>
    </AbsoluteFill>
  );
};
