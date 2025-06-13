import React, { useRef, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function MouthGuardModel({ mouthLandmarks, videoWidth, videoHeight, isMouthOpen }) {
  const { scene } = useGLTF("/mouthguard.glb");
  const modelRef = useRef();
  const { camera } = useThree();

  // Clone the scene to avoid modifying the original
  const clonedScene = useMemo(() => {
    const cloned = scene.clone();
    // Traverse and fix materials
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.9;
      }
    });
    return cloned;
  }, [scene]);

  useFrame(() => {
    if (!modelRef.current || !mouthLandmarks) {
      if (modelRef.current) {
        modelRef.current.visible = false;
      }
      return;
    }

    modelRef.current.visible = true;

    // Calculate mouth center from landmarks
    const leftCorner = mouthLandmarks[0]; // Leftmost point
    const rightCorner = mouthLandmarks[6]; // Rightmost point
    const topPoint = mouthLandmarks[14]; // Top center of upper lip
    const bottomPoint = mouthLandmarks[18]; // Bottom center of lower lip

    // Calculate center position
    const centerX = (leftCorner.x + rightCorner.x) / 2;
    const centerY = (topPoint.y + bottomPoint.y) / 2;

    // Calculate mouth dimensions
    const mouthWidth = Math.abs(rightCorner.x - leftCorner.x);
    const mouthHeight = Math.abs(bottomPoint.y - topPoint.y);

    // Convert to normalized coordinates (-1 to 1)
    // Don't mirror X here since the canvas is already mirrored
    const normalizedX = (centerX / videoWidth) * 2 - 1;
    const normalizedY = -(centerY / videoHeight) * 2 + 1;

    // Position the model
    modelRef.current.position.set(normalizedX * 3, normalizedY * 3, 0);

    // Scale based on mouth size - made very small
    const baseScale = 0.01; // Much smaller base scale
    const widthScale = (mouthWidth / videoWidth) * 0.5; // Very small multiplier
    const scale = baseScale * widthScale;

    modelRef.current.scale.set(scale, scale, scale);

    // Calculate rotation based on mouth angle
    const mouthAngle = Math.atan2(rightCorner.y - leftCorner.y, rightCorner.x - leftCorner.x);
    modelRef.current.rotation.z = mouthAngle;
  });

  return <primitive ref={modelRef} object={clonedScene} />;
}

const MouthOverlay = ({ mouthLandmarks, videoWidth, videoHeight, isMouthOpen }) => {
  useEffect(() => {
    console.log("MouthOverlay props:", {
      hasMouthLandmarks: !!mouthLandmarks,
      landmarksLength: mouthLandmarks?.length,
      videoWidth,
      videoHeight,
      isMouthOpen,
    });
  }, [mouthLandmarks, videoWidth, videoHeight, isMouthOpen]);

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
          aspect: videoWidth / videoHeight,
          near: 0.1,
          far: 1000,
        }}
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          pointerEvents: "none",
        }}
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.NoToneMapping,
        }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[0, 0, 5]} intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <directionalLight position={[-5, 5, 5]} intensity={0.5} />

        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[0.5, 0.5, 0.5]} />
              <meshBasicMaterial color="yellow" />
            </mesh>
          }
        >
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

export default MouthOverlay;

// Preload the GLB model
useGLTF.preload("/mouthguard.glb");
