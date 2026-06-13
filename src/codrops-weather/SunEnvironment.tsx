/** Localized lights for the sun — no fullscreen sky */
export function SunEnvironment() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 4]} intensity={0.65} color="#fff8e8" />
      <pointLight position={[-6, 2, -4]} intensity={0.15} color="#ffe8c8" />
    </>
  );
}
