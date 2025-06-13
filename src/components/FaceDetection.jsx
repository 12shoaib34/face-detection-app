import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import "./FaceDetection.css";
import ModelsSlider from "./ModelsSlider/ModelsSlider";
import MouthOverlay from "./MouthOverlay/MouthOverlay";
import ModelImagesPanel from "./ModelImagesPanel/ModelImagesPanel";
import CameraFeedHeader from "./CameraFeedHeader/CameraFeedHeader";

const FaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [mouthLandmarks, setMouthLandmarks] = useState(null);
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 360, height: 640 });
  const [selectedModel, setSelectedModel] = useState(null);
  
  const [selectedImage, setSelectedImage] = useState(null);

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
        // Skip face detection model loading since we're using mock landmarks
        // await Promise.all([
        //   faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
        //   faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        //   faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        //   faceapi.nets.faceExpressionNet.loadFromUri("/models"),
        // ]);
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
    setVideoSize(displaySize);

    // Set canvas size to match video
    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    faceapi.matchDimensions(canvas, displaySize);

    const detectInterval = setInterval(async () => {
      try {
        // Create mock mouth landmarks positioned in the center of the video
        // This will show the mouthguard without requiring face detection
        if (selectedModel) {
          const centerX = displaySize.width / 2;
          const centerY = displaySize.height / 2;
          const mouthWidth = 60;
          const mouthHeight = 20;
          
          // Create mock mouth landmarks in the expected format
          const mockMouthLandmarks = [
            { x: centerX - mouthWidth/2, y: centerY }, // Left corner
            { x: centerX - mouthWidth/3, y: centerY - mouthHeight/4 },
            { x: centerX - mouthWidth/6, y: centerY - mouthHeight/2 },
            { x: centerX, y: centerY - mouthHeight/2 },
            { x: centerX + mouthWidth/6, y: centerY - mouthHeight/2 },
            { x: centerX + mouthWidth/3, y: centerY - mouthHeight/4 },
            { x: centerX + mouthWidth/2, y: centerY }, // Right corner
            { x: centerX + mouthWidth/3, y: centerY + mouthHeight/4 },
            { x: centerX + mouthWidth/6, y: centerY + mouthHeight/2 },
            { x: centerX, y: centerY + mouthHeight/2 },
            { x: centerX - mouthWidth/6, y: centerY + mouthHeight/2 },
            { x: centerX - mouthWidth/3, y: centerY + mouthHeight/4 },
            { x: centerX - mouthWidth/4, y: centerY - mouthHeight/3 }, // Inner lip points
            { x: centerX - mouthWidth/8, y: centerY - mouthHeight/3 },
            { x: centerX, y: centerY - mouthHeight/3 }, // Top center
            { x: centerX + mouthWidth/8, y: centerY - mouthHeight/3 },
            { x: centerX + mouthWidth/4, y: centerY - mouthHeight/3 },
            { x: centerX + mouthWidth/4, y: centerY + mouthHeight/3 },
            { x: centerX, y: centerY + mouthHeight/3 }, // Bottom center
            { x: centerX - mouthWidth/4, y: centerY + mouthHeight/3 }
          ];
          
          setMouthLandmarks(mockMouthLandmarks);
          setIsMouthOpen(false); // Default to closed mouth
          setDetectionCount((prev) => prev + 1);
        } else {
          // Clear landmarks when no model is selected
          setMouthLandmarks(null);
        }
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
          <CameraFeedHeader />
          {!isModelLoaded && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading face detection models...</p>
            </div>
          )}

          <video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} className="camera-feed" />

          <canvas ref={canvasRef} className="detection-canvas" />

          {mouthLandmarks && selectedModel && (
            <MouthOverlay
              mouthLandmarks={mouthLandmarks}
              videoWidth={videoSize.width}
              videoHeight={videoSize.height}
              isMouthOpen={isMouthOpen}
            />
          )}
          

          <ModelsSlider onModelSelect={setSelectedModel} />

          {selectedModel && <ModelImagesPanel selectedModel={selectedModel} onImageSelect={setSelectedImage} />}
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
