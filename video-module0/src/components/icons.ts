// Pictogrammes en traits simples, centrés sur (x, y), dans un carré d'environ 2·s.
// Chaque fonction renvoie un attribut « d » à dessiner avec <DrawPath>.

const rect = (x: number, y: number, w: number, h: number) =>
  `M ${x - w} ${y - h} H ${x + w} V ${y + h} H ${x - w} Z`;

export const circlePath = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`;

export const roundRectPath = (
  x: number,
  y: number,
  w: number,
  h: number,
  r = 10,
) =>
  `M ${x + r} ${y} H ${x + w - r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V ${y + h - r} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} H ${x + r} A ${r} ${r} 0 0 1 ${x} ${y + h - r} V ${y + r} A ${r} ${r} 0 0 1 ${x + r} ${y} Z`;

export const icons = {
  chip: (x: number, y: number, s = 30) => {
    const a = s * 0.75;
    const b = s * 0.35;
    const pins = [-0.4, 0, 0.4]
      .map((k) => {
        const o = k * a * 1.2;
        return `M ${x + o} ${y - a} V ${y - s} M ${x + o} ${y + a} V ${y + s} M ${x - a} ${y + o} H ${x - s} M ${x + a} ${y + o} H ${x + s}`;
      })
      .join(" ");
    return `${rect(x, y, a, a)} ${rect(x, y, b, b)} ${pins}`;
  },
  memory: (x: number, y: number, s = 30) =>
    [0.5, 0.15, -0.2, -0.55]
      .map((k) => `M ${x - s} ${y + k * s} H ${x + s}`)
      .join(" ") + ` ${rect(x, y, s, s * 0.8)}`,
  network: (x: number, y: number, s = 30) =>
    `M ${x - s} ${y - s * 0.3} H ${x + s * 0.8} M ${x + s * 0.45} ${y - s * 0.65} L ${x + s * 0.85} ${y - s * 0.3} L ${x + s * 0.45} ${y + s * 0.05} ` +
    `M ${x + s} ${y + s * 0.35} H ${x - s * 0.8} M ${x - s * 0.45} ${y} L ${x - s * 0.85} ${y + s * 0.35} L ${x - s * 0.45} ${y + s * 0.7}`,
  bolt: (x: number, y: number, s = 30) =>
    `M ${x + s * 0.2} ${y - s} L ${x - s * 0.45} ${y + s * 0.12} H ${x + s * 0.05} L ${x - s * 0.2} ${y + s} L ${x + s * 0.5} ${y - s * 0.2} H ${x} Z`,
  snow: (x: number, y: number, s = 30) =>
    [0, 60, 120]
      .map((deg) => {
        const a = (deg * Math.PI) / 180;
        return `M ${x - s * Math.cos(a)} ${y - s * Math.sin(a)} L ${x + s * Math.cos(a)} ${y + s * Math.sin(a)}`;
      })
      .join(" "),
  server: (x: number, y: number, s = 30) =>
    `${rect(x, y, s * 0.7, s)} ` +
    [-0.6, -0.2, 0.2, 0.6]
      .map((k) => `M ${x - s * 0.5} ${y + k * s} H ${x + s * 0.2}`)
      .join(" "),
  rack: (x: number, y: number, s = 30) =>
    `${rect(x, y, s * 0.8, s)} ` +
    [-0.7, -0.35, 0, 0.35, 0.7]
      .map((k) => `M ${x - s * 0.8} ${y + k * s} H ${x + s * 0.8}`)
      .join(" "),
  wafer: (x: number, y: number, s = 30) => {
    const grid = [-0.5, 0, 0.5]
      .map((k) => {
        const o = k * s;
        const h = Math.sqrt(s * s - o * o) * 0.85;
        return `M ${x + o} ${y - h} V ${y + h} M ${x - h} ${y + o} H ${x + h}`;
      })
      .join(" ");
    return `${circlePath(x, y, s)} ${grid}`;
  },
  cloud: (x: number, y: number, s = 30) =>
    `M ${x - s} ${y + s * 0.45} A ${s * 0.4} ${s * 0.4} 0 0 1 ${x - s * 0.7} ${y - s * 0.2} A ${s * 0.55} ${s * 0.55} 0 0 1 ${x + s * 0.3} ${y - s * 0.35} A ${s * 0.45} ${s * 0.45} 0 0 1 ${x + s} ${y + s * 0.45} Z`,
  token: (x: number, y: number, s = 30) =>
    `M ${x - s + s * 0.45} ${y - s * 0.45} H ${x + s - s * 0.45} A ${s * 0.45} ${s * 0.45} 0 0 1 ${x + s - s * 0.45} ${y + s * 0.45} H ${x - s + s * 0.45} A ${s * 0.45} ${s * 0.45} 0 0 1 ${x - s + s * 0.45} ${y - s * 0.45} Z M ${x + s * 0.1} ${y - s * 0.3} V ${y + s * 0.3}`,
  factory: (x: number, y: number, s = 30) =>
    `M ${x - s} ${y + s * 0.7} V ${y - s * 0.1} L ${x - s * 0.5} ${y - s * 0.45} V ${y - s * 0.1} L ${x} ${y - s * 0.45} V ${y - s * 0.1} L ${x + s * 0.5} ${y - s * 0.45} V ${y - s} H ${x + s * 0.8} V ${y + s * 0.7} Z`,
  gear: (x: number, y: number, s = 30) => {
    const teeth = new Array(8)
      .fill(0)
      .map((_, i) => {
        const a = (i * Math.PI) / 4;
        return `M ${x + Math.cos(a) * s * 0.7} ${y + Math.sin(a) * s * 0.7} L ${x + Math.cos(a) * s} ${y + Math.sin(a) * s}`;
      })
      .join(" ");
    return `${circlePath(x, y, s * 0.7)} ${circlePath(x, y, s * 0.28)} ${teeth}`;
  },
  euro: (x: number, y: number, s = 30) =>
    `M ${x + s * 0.6} ${y - s * 0.7} A ${s * 0.8} ${s * 0.8} 0 1 0 ${x + s * 0.6} ${y + s * 0.7} M ${x - s} ${y - s * 0.2} H ${x + s * 0.2} M ${x - s} ${y + s * 0.2} H ${x + s * 0.2}`,
  pencil: (x: number, y: number, s = 30) =>
    `M ${x - s} ${y + s} L ${x - s * 0.8} ${y + s * 0.3} L ${x + s * 0.5} ${y - s} L ${x + s} ${y - s * 0.5} L ${x - s * 0.3} ${y + s * 0.8} Z M ${x + s * 0.25} ${y - s * 0.75} L ${x + s * 0.75} ${y - s * 0.25}`,
  magnifier: (x: number, y: number, s = 30) =>
    `${circlePath(x - s * 0.2, y - s * 0.2, s * 0.6)} M ${x + s * 0.23} ${y + s * 0.23} L ${x + s} ${y + s}`,
  check: (x: number, y: number, s = 30) =>
    `M ${x - s} ${y} L ${x - s * 0.3} ${y + s * 0.7} L ${x + s} ${y - s * 0.7}`,
  cross: (x: number, y: number, s = 30) =>
    `M ${x - s * 0.7} ${y - s * 0.7} L ${x + s * 0.7} ${y + s * 0.7} M ${x + s * 0.7} ${y - s * 0.7} L ${x - s * 0.7} ${y + s * 0.7}`,
  bottleneck: (x: number, y: number, s = 30) =>
    `M ${x - s} ${y - s * 0.7} H ${x - s * 0.25} C ${x - s * 0.1} ${y - s * 0.7} ${x - s * 0.1} ${y - s * 0.15} ${x} ${y - s * 0.15} C ${x + s * 0.1} ${y - s * 0.15} ${x + s * 0.1} ${y - s * 0.7} ${x + s * 0.25} ${y - s * 0.7} H ${x + s} ` +
    `M ${x - s} ${y + s * 0.7} H ${x - s * 0.25} C ${x - s * 0.1} ${y + s * 0.7} ${x - s * 0.1} ${y + s * 0.15} ${x} ${y + s * 0.15} C ${x + s * 0.1} ${y + s * 0.15} ${x + s * 0.1} ${y + s * 0.7} ${x + s * 0.25} ${y + s * 0.7} H ${x + s}`,
  thermometer: (x: number, y: number, s = 30) =>
    `M ${x - s * 0.2} ${y + s * 0.45} V ${y - s * 0.8} A ${s * 0.2} ${s * 0.2} 0 0 1 ${x + s * 0.2} ${y - s * 0.8} V ${y + s * 0.45} A ${s * 0.4} ${s * 0.4} 0 1 1 ${x - s * 0.2} ${y + s * 0.45} Z M ${x} ${y + s * 0.6} V ${y - s * 0.4}`,
  light: (x: number, y: number, s = 30) =>
    `M ${x - s} ${y} C ${x - s * 0.6} ${y - s * 0.8} ${x - s * 0.2} ${y - s * 0.8} ${x} ${y} C ${x + s * 0.2} ${y + s * 0.8} ${x + s * 0.6} ${y + s * 0.8} ${x + s} ${y}`,
  building: (x: number, y: number, s = 30) =>
    `${rect(x, y + s * 0.1, s * 0.8, s * 0.9)} ` +
    [-0.4, 0, 0.4]
      .map(
        (k) =>
          `M ${x - s * 0.45} ${y + k * s} H ${x - s * 0.15} M ${x + s * 0.15} ${y + k * s} H ${x + s * 0.45}`,
      )
      .join(" "),
  book: (x: number, y: number, s = 30) =>
    `${rect(x, y, s, s * 0.75)} M ${x - s * 0.6} ${y - s * 0.3} H ${x + s * 0.6} M ${x - s * 0.6} ${y} H ${x + s * 0.6} M ${x - s * 0.6} ${y + s * 0.3} H ${x + s * 0.2}`,
  person: (x: number, y: number, s = 30) =>
    `${circlePath(x, y - s * 0.45, s * 0.35)} M ${x - s * 0.75} ${y + s} C ${x - s * 0.75} ${y + s * 0.15} ${x + s * 0.75} ${y + s * 0.15} ${x + s * 0.75} ${y + s}`,
  chart: (x: number, y: number, s = 30) =>
    `M ${x - s} ${y - s} V ${y + s} H ${x + s} M ${x - s * 0.7} ${y + s * 0.4} L ${x - s * 0.2} ${y - s * 0.1} L ${x + s * 0.2} ${y + s * 0.2} L ${x + s * 0.8} ${y - s * 0.6}`,
  stack: (x: number, y: number, s = 30) =>
    [-0.6, -0.2, 0.2, 0.6]
      .map(
        (k) =>
          `M ${x - s} ${y + k * s} L ${x} ${y + k * s - s * 0.25} L ${x + s} ${y + k * s} L ${x} ${y + k * s + s * 0.25} Z`,
      )
      .join(" "),
};

export type IconName = keyof typeof icons;
