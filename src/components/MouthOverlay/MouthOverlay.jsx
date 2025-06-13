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

    // Only show mouthguard when mouth is open
    modelRef.current.visible = isMouthOpen;

    // Calculate mouth center from landmarks - focusing on inner mouth area
    const leftCorner = mouthLandmarks[0]; // Leftmost point
    const rightCorner = mouthLandmarks[6]; // Rightmost point
    const topPoint = mouthLandmarks[13]; // Upper inner lip center
    const bottomPoint = mouthLandmarks[19]; // Lower inner lip center

    // Calculate center position - bias towards inner mouth
    const centerX = (leftCorner.x + rightCorner.x) / 2;
    const centerY = (topPoint.y + bottomPoint.y) / 2;

    // Calculate mouth dimensions
    const mouthWidth = Math.abs(rightCorner.x - leftCorner.x);
    const mouthHeight = Math.abs(bottomPoint.y - topPoint.y);

    // Convert to normalized coordinates (-1 to 1)
    // Mirror X coordinate to match mirrored video
    const normalizedX = -((centerX / videoWidth) * 2 - 1);
    const normalizedY = -(centerY / videoHeight) * 2 + 1.1;

    // Position the model - precisely in the mouth center
    modelRef.current.position.set(normalizedX * 1.8, normalizedY * 1.8, -0.05);

    // Scale based on mouth size - made much smaller to fit inside mouth
    const baseScale = 0.003; // Much smaller base scale
    const widthScale = (mouthWidth / videoWidth) * 0.3; // Very small multiplier
    const scale = Math.max(baseScale * widthScale, 0.001); // Very small minimum scale

    modelRef.current.scale.set(scale, scale, scale);

    // Calculate rotation based on mouth angle + 180 degree rotation
    const mouthAngle = Math.atan2(rightCorner.y - leftCorner.y, rightCorner.x - leftCorner.x);
    modelRef.current.rotation.z = -mouthAngle; // Add 180 degrees (π radians)
    modelRef.current.rotation.y = 0; // Add 180 degrees (π radians)
    modelRef.current.rotation.x = Math.PI; // Add 180 degrees (π radians)
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
        zIndex: 10,
      }}
    >
      {/* Show "Open your mouth" text when mouth is closed */}
      {/* {!isMouthOpen && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: "24px",
            fontWeight: "bold",
            textAlign: "center",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            padding: "15px 25px",
            borderRadius: "10px",
            backdropFilter: "blur(5px)",
          }}
        >
          Open your mouth
        </div>
      )} */}

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
            style={{
              backgroundColor: "red",
            }}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default MouthOverlay;

// Preload the GLB model
useGLTF.preload("/mouthguard.glb");
