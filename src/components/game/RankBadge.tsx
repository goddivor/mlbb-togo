'use client';

/**
 * Affiche le logo d'un rang MLBB à partir d'une seule planche d'icônes
 * (sprite sheet `public/mlbb_rank_icons.png`) via background-position.
 * Coordonnées mesurées au pixel près sur l'image 1251×639.
 *
 * Note : la planche fournie ne contient pas le rang « Master » ; pour ce palier
 * (ou tout palier inconnu) le composant ne rend rien (repli texte côté appelant).
 */

const SPRITE = { src: '/mlbb_rank_icons.png', w: 1251, h: 639 };

type Box = { x: number; y: number; w: number; h: number };

const BOXES: Record<string, Box> = {
  Warrior: { x: 12, y: 32, w: 178, h: 180 },
  Elite: { x: 223, y: 41, w: 172, h: 171 },
  Grandmaster: { x: 426, y: 41, w: 189, h: 171 },
  Epic: { x: 648, y: 36, w: 192, h: 176 },
  Legend: { x: 866, y: 36, w: 199, h: 176 },
  Mythic: { x: 6, y: 318, w: 207, h: 234 },
  'Mythic Honor': { x: 241, y: 327, w: 207, h: 225 },
  'Mythic Glory': { x: 548, y: 318, w: 208, h: 234 },
  'Mythic Immortal': { x: 905, y: 315, w: 208, h: 237 },
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
  size?: number; // hauteur d'affichage en px ; la largeur suit le ratio du badge
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
