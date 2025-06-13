import React from "react";
import { Canvas } from "@react-three/fiber";

const TestOverlay = ({ videoWidth, videoHeight }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: videoWidth,
        height: videoHeight,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <Canvas
        style={{ 
          width: "100%", 
          height: "100%", 
          background: "transparent",
        }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 0, 5]} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </Canvas>
    </div>
  );
};

export default TestOverlay;