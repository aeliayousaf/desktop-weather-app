/** Dim, cool lighting for the moon at night */
export function MoonEnvironment() {
  return (
    <>
      <ambientLight intensity={0.14} />
      <directionalLight position={[5, 8, 4]} intensity={0.22} color="#b8c8e8" />
      <pointLight position={[-6, 2, -4]} intensity={0.06} color="#c0d0f0" />
    </>
  );
}
