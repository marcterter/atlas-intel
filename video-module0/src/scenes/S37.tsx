import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const BOX_W = 330;
const BOX_H = 80;
const COLS = [
  { x: 150, label: "Amont" },
  { x: 590, label: "Fabrication" },
  { x: 1030, label: "Composants" },
  { x: 1450, label: "Site" },
];
const rowY = (i: number) => 250 + i * 98;
const MID = 450;

type Co = {
  name: string;
  ticker: string;
  place?: string;
  fn: string;
  col: number;
  y: number;
  s: number;
};
const COMPANIES: Co[] = [
  {
    name: "NVIDIA",
    ticker: "NVDA",
    fn: "Accélérateurs et plateforme de calcul",
    col: 2,
    y: rowY(0),
    s: 1,
  },
  {
    name: "TSMC",
    ticker: "TSM",
    place: "aux États-Unis",
    fn: "Fabrication sous contrat et packaging",
    col: 1,
    y: MID,
    s: 2,
  },
  { name: "ASML", ticker: "ASML", fn: "Lithographie", col: 0, y: MID, s: 3 },
  {
    name: "SK hynix",
    ticker: "000660",
    place: "en Corée",
    fn: "Mémoire",
    col: 2,
    y: rowY(1),
    s: 4,
  },
  { name: "Micron", ticker: "MU", fn: "Mémoire", col: 2, y: rowY(2), s: 5 },
  {
    name: "Broadcom",
    ticker: "AVGO",
    fn: "Puces réseau et silicium personnalisé",
    col: 2,
    y: rowY(3),
    s: 6,
  },
  {
    name: "Cadence",
    ticker: "CDNS",
    fn: "Logiciels de conception électronique",
    col: 0,
    y: MID - 150,
    s: 7,
  },
  {
    name: "Ajinomoto",
    ticker: "2802",
    place: "au Japon",
    fn: "Notamment matériaux isolants pour substrats",
    col: 0,
    y: MID + 150,
    s: 8,
  },
  {
    name: "Coherent",
    ticker: "COHR",
    fn: "Composants et technologies photoniques",
    col: 2,
    y: rowY(4),
    s: 9,
  },
  {
    name: "Vertiv",
    ticker: "VRT",
    fn: "Alimentation et refroidissement",
    col: 3,
    y: MID,
    s: 10,
  },
];

const CompanyBox: React.FC<{ co: Co; active: boolean; start: number }> = ({
  co,
  active,
  start,
}) => {
  const frame = useCurrentFrame();
  const x = COLS[co.col].x;
  const w = co.col === 3 ? BOX_W - 0 : BOX_W;
  const glow = progress(frame, start + 6, 0.5);
  return (
    <g>
      <path
        d={roundRectPath(x, co.y, w, BOX_H, 12)}
        fill={active ? COLORS.accent : "#ffffff"}
        opacity={(active ? 0.12 : 0.04) * glow}
      />
      <DrawPath
        d={roundRectPath(x, co.y, w, BOX_H, 12)}
        start={start}
        duration={0.6}
        stroke={active ? COLORS.accent : COLORS.inkSoft}
        width={active ? 2 : 1.4}
      />
      <SvgText
        x={x + 26}
        y={co.y + BOX_H / 2}
        text={co.ticker}
        start={start + 6}
        anchor="start"
        size={32}
        weight={active ? 400 : 300}
        color={active ? COLORS.accent : COLORS.ink}
      />
      <SvgText
        x={x + w - 24}
        y={co.y + BOX_H / 2}
        text={co.name}
        start={start + 10}
        anchor="end"
        size={24}
        color={COLORS.inkSoft}
      />
    </g>
  );
};

// Scène 37 — Les dix entreprises repères placées sur une mini-carte de la chaîne.
export const S37: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(0);
  const current = COMPANIES.reduce(
    (acc, c, i) => (frame >= cues.s(c.s) ? i : acc),
    -1,
  );
  const colMid = (i: number) => COLS[i].x + BOX_W / 2;
  return (
    <AbsoluteFill>
      <Title
        text="Dix repères pour ranger les entreprises dans ta carte"
        start={t}
        top={105}
      />
      <Svg>
        {COLS.map((c, i) => (
          <SvgText
            key={c.label}
            x={colMid(i)}
            y={215}
            text={c.label.toUpperCase()}
            start={t + 20 + i * 6}
            size={22}
            weight={500}
            spacing="0.28em"
            color={COLORS.inkSoft}
          />
        ))}
        {/* Liens de la chaîne : amont → fabrication → composants → site. */}
        {[MID - 150, MID, MID + 150].map((y, i) => (
          <Link
            key={y}
            from={[COLS[0].x + BOX_W, y + BOX_H / 2]}
            to={[COLS[1].x, MID + BOX_H / 2]}
            start={t + 40 + i * 6}
            color={COLORS.inkFaint}
          />
        ))}
        <Link
          from={[COLS[1].x + BOX_W, MID + BOX_H / 2]}
          to={[COLS[2].x, MID + BOX_H / 2]}
          start={t + 60}
          color={COLORS.inkFaint}
        />
        <Link
          from={[COLS[2].x + BOX_W, MID + BOX_H / 2]}
          to={[COLS[3].x, MID + BOX_H / 2]}
          start={t + 70}
          color={COLORS.inkFaint}
        />
        {/* Emplacements vides, en pointillés, avant l'arrivée des entreprises. */}
        {COMPANIES.map((c) => {
          const o =
            interpolate(frame, [t + 30, t + 50], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) *
            (1 - progress(frame, cues.s(c.s), 0.4));
          return o > 0 ? (
            <path
              key={c.ticker + "slot"}
              d={roundRectPath(COLS[c.col].x, c.y, BOX_W, BOX_H, 12)}
              fill="none"
              stroke={COLORS.inkFaint}
              strokeDasharray="6 8"
              opacity={o}
            />
          ) : null;
        })}
        {COMPANIES.map((c, i) => (
          <CompanyBox
            key={c.ticker}
            co={c}
            start={cues.s(c.s)}
            active={i === current}
          />
        ))}
      </Svg>
      {/* Fiche de l'entreprise courante. */}
      {COMPANIES.map((c, i) => {
        const from = cues.s(c.s);
        const to = i < COMPANIES.length - 1 ? cues.s(COMPANIES[i + 1].s) : 1e9;
        if (frame < from - 2 || frame > to) return null;
        const out = interpolate(frame, [to - 6, to], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={c.ticker}
            style={{
              position: "absolute",
              top: 760,
              width: "100%",
              textAlign: "center",
              opacity: out,
            }}
          >
            <FadeIn start={from} rise={8}>
              <div
                style={{
                  ...textStyle(22, 500),
                  color: COLORS.accent,
                  letterSpacing: "0.22em",
                }}
              >
                {c.name.toUpperCase()} · {c.ticker}
                {c.place ? ` ${c.place.toUpperCase()}` : ""}
              </div>
            </FadeIn>
            <FadeIn start={from + 6} rise={8}>
              <div style={{ ...textStyle(38, 300), marginTop: 12 }}>{c.fn}</div>
            </FadeIn>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
