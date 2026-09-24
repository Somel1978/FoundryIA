"use client";

import { useState } from "react";

/** <img> that disappears if it fails to load (e.g. a blocked external preview), revealing what's behind it. */
export function SafeImg(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} onError={() => setFailed(true)} />;
}
