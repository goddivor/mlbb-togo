'use client';

const SPRITE = { src: '/mlbb_rank_icons.png', w: 1251, h: 639 };

type Box = { x: number; y: number; w: number; h: number };

const BOXES: Record<string, Box> = {
  Warrior: { x: 12, y: 32, w: 178, h: 191 },
  Elite: { x: 223, y: 41, w: 172, h: 185 },
  Grandmaster: { x: 426, y: 41, w: 189, h: 215 },
  Epic: { x: 648, y: 37, w: 192, h: 223 },
  Legend: { x: 866, y: 37, w: 199, h: 238 },
  Mythic: { x: 6, y: 319, w: 207, h: 233 },
  'Mythic Honor': { x: 241, y: 328, w: 207, h: 230 },
  'Mythic Glory': { x: 548, y: 321, w: 208, h: 242 },
  'Mythic Immortal': { x: 905, y: 305, w: 208, h: 267 },
};

export function hasRankBadge(rank?: string | null): boolean {
  return !!rank && rank in BOXES;
}

export default function RankBadge({
  rank,
  size = 28,
  className,
}: {
  rank?: string | null;
  size?: number;
  className?: string;
}) {
  if (!rank) return null;
  const b = BOXES[rank];
  if (!b) return null;
  const scale = size / b.h;
  return (
    <span
      role="img"
      aria-label={rank}
      title={rank}
      className={className}
      style={{
        display: 'inline-block',
        width: b.w * scale,
        height: b.h * scale,
        backgroundImage: `url(${SPRITE.src})`,
        backgroundSize: `${SPRITE.w * scale}px ${SPRITE.h * scale}px`,
        backgroundPosition: `${-b.x * scale}px ${-b.y * scale}px`,
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
