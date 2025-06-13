import React, { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

function MouthGuardModel({ mouthLandmarks, videoWidth, videoHeight, isMouthOpen }) {
  const { scene } = useGLTF("/mouthguard.glb");
  const modelRef = useRef();
  const { camera, size } = useThree();

  useEffect(() => {
    // Clone the scene to avoid modifying the original
    if (modelRef.current && scene) {
      modelRef.current.clear();
      const cloned = scene.clone();
      cloned.traverse((child) => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.9;
        }
      });
      modelRef.current.add(cloned);
    }
  }, [scene]);

  useFrame(() => {
    if (!modelRef.current || !mouthLandmarks || !isMouthOpen) {
      if (modelRef.current) {
        modelRef.current.visible = false;
      }
      return;
    }

    modelRef.current.visible = true;

    // Calculate mouth metrics
    const leftCorner = mouthLandmarks[0];
    const rightCorner = mouthLandmarks[6];
    const topPoint = mouthLandmarks[13];
    const bottomPoint = mouthLandmarks[19];

    // Calculate center position
    const centerX = (leftCorner.x + rightCorner.x) / 2;
    const centerY = (topPoint.y + bottomPoint.y) / 2;

    // Convert to normalized device coordinates (-1 to 1)
    const ndcX = (centerX / videoWidth) * 2 - 1;
    const ndcY = -(centerY / videoHeight) * 2 + 1;

    // Calculate position in 3D space
    const aspect = size.width / size.height;
    const vFov = (camera.fov * Math.PI) / 180;
    const planeHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
    const planeWidth = planeHeight * aspect;

    modelRef.current.position.x = ndcX * planeWidth * 0.5;
    modelRef.current.position.y = ndcY * planeHeight * 0.5;
    modelRef.current.position.z = 0;

    // Calculate scale based on mouth size
    const mouthWidth = Math.abs(rightCorner.x - leftCorner.x);
    const mouthHeight = Math.abs(bottomPoint.y - topPoint.y);
    const baseScale = 0.001; // Much smaller base scale
    const widthFactor = (mouthWidth / videoWidth) * 15; // Reduced multiplier
    const scale = baseScale * widthFactor;

    modelRef.current.scale.set(scale, scale * 0.8, scale * 0.6); // Slightly flatter for mouth shape

    // Calculate rotation based on mouth angle
    const angle = Math.atan2(rightCorner.y - leftCorner.y, rightCorner.x - leftCorner.x);
    modelRef.current.rotation.z = -angle;
    modelRef.current.rotation.x = Math.PI;
  });

  return <group ref={modelRef} />;
}

const MouthOverlayOptimized = ({ mouthLandmarks, videoWidth, videoHeight, isMouthOpen }) => {
  if (!mouthLandmarks || mouthLandmarks.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: videoWidth,
        height: videoHeight,
        pointerEvents: "none",
        transform: "scaleX(-1)", // Mirror to match video
        zIndex: 10,
      }}
    >
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 50,
        }}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
        }}
        gl={{
          alpha: true,
          antialias: false, // Disable for performance
          powerPreference: "high-performance",
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[0, 0, 5]} intensity={1} />

        <Suspense fallback={null}>
          <MouthGuardModel
            mouthLandmarks={mouthLandmarks}
            videoWidth={videoWidth}
            videoHeight={videoHeight}
            isMouthOpen={isMouthOpen}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default MouthOverlayOptimized;

// Preload the GLB model
useGLTF.preload("/mouthguard.glb");
