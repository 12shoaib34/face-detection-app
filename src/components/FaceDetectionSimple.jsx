import React, { useRef, useEffect } from "react";
import * as faceapi from "face-api.js";

const FaceDetectionSimple = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const loadModelsAndStartVideo = async () => {
      // Load only the essential models first
      console.log("Loading models...");
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        console.log("Models loaded!");

        // Start video
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error:", error);
      }
    };

    loadModelsAndStartVideo();
  }, []);

  const detectFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      // Simple detection
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      console.log(detection, "asdasdas");

      if (detection) {
        console.log("Face detected!");

        // Clear canvas
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bounding box
        const box = detection.detection.box;
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        // Draw landmarks
        const landmarks = detection.landmarks;
        ctx.fillStyle = "#00ff00";

        // Draw points for all landmarks
        landmarks.positions.forEach((point) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
          ctx.fill();
        });
      }
    } catch (error) {
      console.error("Detection error:", error);
    }

    // Continue detecting
    requestAnimationFrame(detectFace);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <video ref={videoRef} autoPlay muted onPlay={detectFace} style={{ display: "block" }} />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default FaceDetectionSimple;
