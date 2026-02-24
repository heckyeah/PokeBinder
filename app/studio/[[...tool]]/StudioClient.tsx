"use client";

import dynamic from "next/dynamic";
import config from "../../../sanity.config";

const NextStudio = dynamic(
  () => import("next-sanity/studio").then((mod) => mod.NextStudio),
  { ssr: false }
);

export function StudioClient() {
  return (
    <div className="h-screen w-screen">
      <NextStudio config={config} />
    </div>
  );
}
