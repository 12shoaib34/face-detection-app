import React, { useRef, useEffect, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import "./FaceDetection.css";
import ModelsSlider from "./ModelsSlider/ModelsSlider";
import ModelImagesPanel from "./ModelImagesPanel/ModelImagesPanel";
import CameraFeedHeader from "./CameraFeedHeader/CameraFeedHeader";
import MouthOverlayOptimized from "./MouthOverlayOptimized";

const FaceDetectionOptimized = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [error, setError] = useState("");
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [mouthLandmarks, setMouthLandmarks] = useState(null);
  const [isMouthOpen, setIsMouthOpen] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 640, height: 480 });
  
  // Performance optimization states
  const animationFrameRef = useRef(null);
  const lastDetectionTime = useRef(0);
  const detectionInterval = useRef(50); // Start with 50ms, will adapt
  const lastFacePosition = useRef(null);
  const faceVelocity = useRef(0);
  
  // Model image cache
  const modelImageCache = useRef(new Map());

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Starting to load optimized models...");
        // Load only essential models for face detection and landmarks
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri("https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"), // Lighter landmark model
        ]);
        console.log("Essential models loaded!");
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
            width: { ideal: 640 }, // Lower resolution for better performance
            height: { ideal: 480 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log("Camera stream attached");
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

  // Preload model images
  const preloadModelImage = useCallback(async (modelId, imagePath) => {
    if (!modelImageCache.current.has(modelId)) {
      const img = new Image();
      img.src = imagePath;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      modelImageCache.current.set(modelId, img);
    }
    return modelImageCache.current.get(modelId);
  }, []);

  // Adaptive frame rate based on face movement
  const calculateAdaptiveInterval = useCallback((currentFaceBox) => {
    if (!lastFacePosition.current) {
      lastFacePosition.current = currentFaceBox;
      return;
    }

    // Calculate face movement velocity
    const dx = currentFaceBox.x - lastFacePosition.current.x;
    const dy = currentFaceBox.y - lastFacePosition.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Update velocity with smoothing
    faceVelocity.current = faceVelocity.current * 0.7 + distance * 0.3;
    
    // Adapt detection interval based on movement
    if (faceVelocity.current > 10) {
      detectionInterval.current = 30; // Fast movement = more frequent detection
    } else if (faceVelocity.current > 5) {
      detectionInterval.current = 50; // Medium movement
    } else {
      detectionInterval.current = 100; // Slow/no movement = less frequent
    }
    
    lastFacePosition.current = currentFaceBox;
  }, []);


  const detectFace = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    
    if (!video || !canvas || !overlayCanvas) {
      console.log("Detection skipped - missing elements");
      return;
    }
    
    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return; // Silently skip if video not ready yet
    }

    const currentTime = Date.now();
    if (currentTime - lastDetectionTime.current < detectionInterval.current) {
      return;
    }
    lastDetectionTime.current = currentTime;

    try {
      // Use lighter detection options
      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 320, // Smaller input size for faster processing
            scoreThreshold: 0.3,
          })
        )
        .withFaceLandmarks(true); // Use tiny landmarks

      if (detections.length > 0) {
        setDetectionCount((prev) => prev + 1);
        
        const displaySize = {
          width: video.videoWidth,
          height: video.videoHeight,
        };

        // Clear canvases
        const ctx = canvas.getContext("2d");
        const overlayCtx = overlayCanvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        resizedDetections.forEach((detection) => {
          // Update adaptive frame rate
          calculateAdaptiveInterval(detection.detection.box);

          // Process mouth landmarks for 3D overlay
          if (detection.landmarks && selectedModel) {
            const mouthPoints = detection.landmarks.getMouth();
            if (mouthPoints && mouthPoints.length > 0) {
              setMouthLandmarks(mouthPoints);

              // Calculate if mouth is open
              const topPoint = mouthPoints[13];
              const bottomPoint = mouthPoints[19];
              const mouthHeight = Math.abs(bottomPoint.y - topPoint.y);
              const mouthOpenThreshold = 10;
              
              setIsMouthOpen(mouthHeight >= mouthOpenThreshold);
            }
          } else if (!selectedModel) {
            setMouthLandmarks(null);
            setIsMouthOpen(false);
          }
        });

        // If no face detected, clear landmarks
        if (detections.length === 0) {
          setMouthLandmarks(null);
          setIsMouthOpen(false);
        }
      }
    } catch (err) {
      console.error("Detection error:", err);
    }
  }, [calculateAdaptiveInterval, selectedModel]);

  // Use requestAnimationFrame for smooth rendering
  const animate = useCallback(() => {
    detectFace();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [detectFace]);

  const handleVideoPlay = () => {
    console.log("Video started playing");
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!canvas || !overlayCanvas || !video) {
      console.error("Missing video or canvas elements");
      return;
    }

    // Wait for video to have dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log("Video dimensions not ready, waiting...");
      setTimeout(handleVideoPlay, 100);
      return;
    }

    console.log("Video ready with dimensions:", video.videoWidth, "x", video.videoHeight);

    // Set canvas sizes
    const displaySize = {
      width: video.videoWidth,
      height: video.videoHeight,
    };

    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    overlayCanvas.width = displaySize.width;
    overlayCanvas.height = displaySize.height;

    // Set video size for overlay
    setVideoSize(displaySize);

    // Set video ready BEFORE starting detection
    setIsVideoReady(true);

    // Start detection with simple interval
    console.log("Starting detection interval");
    const detectionLoop = setInterval(async () => {
      await detectFace();
    }, 100);

    // Store interval ID for cleanup
    animationFrameRef.current = detectionLoop;
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        clearInterval(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="face-detection-container">
      <div className="camera-section">
        <div className="camera-wrapper">
          <CameraFeedHeader />
          {!isModelLoaded && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>Loading optimized models...</p>
            </div>
          )}

          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            onPlay={handleVideoPlay} 
            className="camera-feed" 
          />

          <canvas ref={canvasRef} className="detection-canvas" />
          
          <canvas 
            ref={overlayCanvasRef} 
            className="detection-canvas"
            style={{ pointerEvents: 'none' }}
          />

          {mouthLandmarks && selectedModel && (
            <MouthOverlayOptimized
              mouthLandmarks={mouthLandmarks}
              videoWidth={videoSize.width}
              videoHeight={videoSize.height}
              isMouthOpen={isMouthOpen}
            />
          )}

          <ModelsSlider onModelSelect={setSelectedModel} />

          {selectedModel && (
            <ModelImagesPanel 
              selectedModel={selectedModel} 
              onImageSelect={setSelectedImage} 
            />
          )}
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

export default FaceDetectionOptimized;