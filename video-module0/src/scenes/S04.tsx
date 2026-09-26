import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Box, Link, Svg } from "../components/kit";
import { progress, useCues } from "../components/motion";
import { COLORS } from "../theme";

const H = 66;
const row = (i: number) => 150 + i * 128;

// Scène 4 — La carte du système : des branches amont qui convergent jusqu'aux tokens.
export const S04: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const b = (beat: number, d = 0) => cues.beat(beat, d);
  const upstream = [
    { x: 560, label: "Matériaux, wafers", at: cues.s(2, 1.6) },
    { x: 960, label: "Équipements", at: cues.s(2, 3.3) },
    { x: 1360, label: "Conception", at: cues.s(2, 5.0) },
  ];
  // Un signal lumineux descend la chaîne principale une fois la carte complète.
  const flow = progress(frame, cues.s(8, 1.5), 3.5);
  const flowY = row(0) + H + flow * (row(5) - row(0) - H);

  return (
    <AbsoluteFill>
      <Svg>
        {upstream.map((u) => (
          <Box
            key={u.label}
            x={u.x - 170}
            y={row(0)}
            w={340}
            h={H}
            label={u.label}
            start={u.at}
          />
        ))}
        {upstream.map((u) => (
          <Link
            key={u.label}
            from={[u.x, row(0) + H]}
            to={[960 + (u.x - 960) * 0.25, row(1)]}
            start={b(1)}
          />
        ))}
        <Box
          x={790}
          y={row(1)}
          w={340}
          h={H}
          label="Fabrication des puces"
          start={b(1, 0.5)}
          variant="hi"
        />

        <Link
          from={[900, row(1) + H]}
          to={[760, row(2)]}
          start={cues.s(4, 1.5)}
        />
        <Link
          from={[1020, row(1) + H]}
          to={[1160, row(2)]}
          start={cues.s(4, 1.5)}
        />
        <Box
          x={600}
          y={row(2)}
          w={320}
          h={H}
          label="Puces de calcul"
          start={cues.s(4, 2.2)}
        />
        <Box
          x={1000}
          y={row(2)}
          w={320}
          h={H}
          label="Puces mémoire"
          start={cues.s(4, 2.9)}
        />

        <Link from={[760, row(2) + H]} to={[900, row(3)]} start={b(3)} />
        <Link from={[1160, row(2) + H]} to={[1020, row(3)]} start={b(3)} />
        <Box
          x={790}
          y={row(3)}
          w={340}
          h={H}
          label="Assemblage et cartes"
          start={b(3, 0.6)}
        />
        <Link from={[960, row(3) + H]} to={[960, row(4)]} start={b(3, 2.2)} />
        <Box
          x={740}
          y={row(4)}
          w={440}
          h={H}
          label="Serveurs et racks en réseau"
          start={b(3, 2.6)}
          variant="hi"
        />

        {/* L'électricité arrive par une autre infrastructure. */}
        <Box
          x={1360}
          y={row(3) + 20}
          w={300}
          h={H}
          label="Alimentation électrique"
          start={cues.s(7, 2.8)}
          variant="side"
          size={22}
        />
        <Box
          x={1360}
          y={row(5) - 40}
          w={300}
          h={H}
          label="Refroidissement"
          start={cues.s(7, 4.2)}
          variant="side"
          size={22}
        />
        <Link
          from={[1360, row(3) + 20 + H / 2]}
          to={[1180, row(4) + 18]}
          start={cues.s(7, 3.4)}
          color={COLORS.warm}
        />
        <Link
          from={[1360, row(5) - 40 + H / 2]}
          to={[1180, row(4) + H - 18]}
          start={cues.s(7, 4.8)}
          color={COLORS.warm}
        />

        <Link from={[960, row(4) + H]} to={[960, row(5)]} start={b(5, 1.2)} />
        <Box
          x={690}
          y={row(5)}
          w={540}
          h={H}
          label="Cloud, logiciels, modèles, tokens"
          start={b(5, 1.6)}
          variant="out"
        />

        {flow > 0 && flow < 1 && (
          <circle cx={960} cy={flowY} r={5} fill={COLORS.accent} />
        )}
      </Svg>
    </AbsoluteFill>
  );
};
