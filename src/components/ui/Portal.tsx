'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Renders children into document.body so that fixed-positioned overlays escape
// any ancestor with a transform/filter/backdrop-blur (which would otherwise
// become the containing block and trap the overlay). SSR-safe: renders nothing
// on the server, then portals once mounted on the client.
export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
