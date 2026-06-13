import { lazy, Suspense } from "react";
import "./animations.css";

interface CloudAnimationProps {
  intensity: number;
}

const CloudScene = lazy(() =>
  import("../../cloud-effect/CloudScene").then((module) => ({
    default: module.CloudScene,
  })),
);

export function CloudAnimation({ intensity }: CloudAnimationProps) {
  return (
    <Suspense fallback={null}>
      <CloudScene intensity={intensity} />
    </Suspense>
  );
}
