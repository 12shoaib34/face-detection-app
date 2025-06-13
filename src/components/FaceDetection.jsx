import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import "./FaceDetection.css";
import ModelsSlider from "./ModelsSlider/ModelsSlider";

const FaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(null);

  const filters = [
    { id: "none", name: "None", color: "#666" },
    { id: "dog", name: "Dog", color: "#8B4513" },
    { id: "cat", name: "Cat", color: "#FFB6C1" },
    { id: "rainbow", name: "Rainbow", color: "#FF6B6B" },
    { id: "glasses", name: "Glasses", color: "#4169E1" },
    { id: "crown", name: "Crown", color: "#FFD700" },
    { id: "mustache", name: "Mustache", color: "#8B4513" },
    { id: "hearts", name: "Hearts", color: "#FF1493" },
    { id: "stars", name: "Stars", color: "#FFD700" },
    { id: "fire", name: "Fire", color: "#FF4500" },
  ];

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Starting to load models...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
          faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        ]);
        console.log("All models loaded successfully!");
        setIsModelLoaded(true);
      } catch (error) {
        console.error("Error loading models:", error);
        setError("Failed to load face detection models");
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    const startVideo = async () => {
      try {
        console.log("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 360 },
            height: { ideal: 640 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("Camera stream attached to video element");
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setError("Failed to access camera");
      }
    };

    if (isModelLoaded) {
      startVideo();
    }
  }, [isModelLoaded]);

  const handleVideoPlay = () => {
    console.log("Video started playing");
    setIsVideoReady(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) {
      console.error("Canvas or video element not found");
      return;
    }

    // Get actual video dimensions
    const displaySize = {
      width: video.videoWidth || 360,
      height: video.videoHeight || 640,
    };

    console.log("Video dimensions:", displaySize);

    // Set canvas size to match video
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    faceapi.matchDimensions(canvas, displaySize);

    const detectInterval = setInterval(async () => {
      try {
        const detections = await faceapi
          .detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 416,
              scoreThreshold: 0.5,
            })
          )
          .withFaceLandmarks()
          .withFaceExpressions();

        if (detections.length > 0) {
          setDetectionCount((prev) => prev + 1);
        }

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Save context state
        ctx.save();

        // Apply mirror transform to match video
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);

        resizedDetections.forEach((detection) => {
          const { landmarks } = detection;

          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 2;

          const jawOutline = landmarks.getJawOutline();
          const leftEyebrow = landmarks.getLeftEyeBrow();
          const rightEyebrow = landmarks.getRightEyeBrow();
          const noseBridge = landmarks.getNose();
          const leftEye = landmarks.getLeftEye();
          const rightEye = landmarks.getRightEye();
          const outerLips = landmarks.getMouth();

          const drawContour = (points, closed = false) => {
            ctx.beginPath();
            points.forEach((point, i) => {
              if (i === 0) {
                ctx.moveTo(point.x, point.y);
              } else {
                ctx.lineTo(point.x, point.y);
              }
            });
            if (closed) {
              ctx.closePath();
            }
            ctx.stroke();
          };

          drawContour(jawOutline);
          drawContour(leftEyebrow);
          drawContour(rightEyebrow);
          drawContour(noseBridge);
          drawContour(leftEye, true);
          drawContour(rightEye, true);
          drawContour(outerLips, true);
        });

        // Restore context state
        ctx.restore();
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 100);

    // Cleanup on unmount
    return () => {
      clearInterval(detectInterval);
    };
  };

  return (
    <div className="face-detection-container">
      <div className="camera-section">
        <div className="camera-wrapper">
          {!isModelLoaded && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading face detection models...</p>
            </div>
          )}

          <video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} className="camera-feed" />

          <canvas ref={canvasRef} className="detection-canvas" />
          <ModelsSlider />
        </div>
      </div>

      {error && (
        <div className="error-overlay">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default FaceDetection;
