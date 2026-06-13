import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { SUN_POSITION } from "./sunConfig";

/** Frames the sun in the upper sky without clipping the top edge */
export function SunCameraRig() {
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    camera.position.set(0, 0.15, 10.5);
    camera.lookAt(SUN_POSITION[0], SUN_POSITION[1], SUN_POSITION[2]);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}
