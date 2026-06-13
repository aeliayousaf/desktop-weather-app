import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import UltimateLensFlare from "./lensflare/LensFlare";
import { SUN_LENS_FLARE_Y } from "./sunConfig";

export function SunPostProcessing() {
  return (
    <EffectComposer>
      <UltimateLensFlare
        position={[0, SUN_LENS_FLARE_Y, 0]}
        blendFunction={BlendFunction.SCREEN}
        opacity={0.85}
        glareSize={1.4}
        starPoints={2}
        animated={false}
        followMouse={false}
        anamorphic={false}
        colorGain={new THREE.Color("#38150b")}
        flareSpeed={0.1}
        flareShape={0.81}
        flareSize={1.4}
        secondaryGhosts
        ghostScale={0.03}
        aditionalStreaks
        starBurst={false}
        haloScale={2.8}
        dirtTextureFile="/lensDirtTexture.jpg"
      />
      <Bloom
        intensity={0.35}
        threshold={0.92}
        luminanceSmoothing={0.85}
        mipmapBlur
      />
    </EffectComposer>
  );
}
