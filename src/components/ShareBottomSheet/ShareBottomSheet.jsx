import { useEffect, useRef, useState } from "react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { FiX } from "react-icons/fi";
import { MdTextFields, MdDraw } from "react-icons/md";
import { IoSparklesSharp } from "react-icons/io5";
import "./ShareBottomSheet.css";

const ShareBottomSheet = ({ isOpen, onClose, capturedImage }) => {
  const [isTextMode, setIsTextMode] = useState(false);
  const [textOverlay, setTextOverlay] = useState("");
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPaths, setDrawPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const textInputRef = useRef(null);
  const overlayRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isTextMode && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [isTextMode]);

  if (!isOpen) return null;

  const handleShare = (platform) => {
    // Placeholder for sharing functionality
    console.log(`Sharing to ${platform}`);
    // In a real app, you would implement platform-specific sharing here
  };

  const handleTextClick = () => {
    if (!textOverlay) {
      setTextPosition({ x: 50, y: 50 });
    }
    setIsTextMode(true);
  };

  const handleTextSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsTextMode(false);
      // Keep the same position
      if (!textOverlay.trim()) {
        setTextOverlay("");
      }
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    if (textOverlay) {
      setIsDragging(true);
      const rect = overlayRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragStart({
        x: x - (textPosition.x / 100) * rect.width,
        y: y - (textPosition.y / 100) * rect.height,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - dragStart.x;
      const y = e.clientY - rect.top - dragStart.y;
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      setTextPosition({
        x: Math.max(0, Math.min(100, xPercent)),
        y: Math.max(0, Math.min(100, yPercent)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    if (textOverlay) {
      const touch = e.touches[0];
      const rect = overlayRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      setDragStart({
        x: x - (textPosition.x / 100) * rect.width,
        y: y - (textPosition.y / 100) * rect.height,
      });
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (isDragging && overlayRef.current) {
      const touch = e.touches[0];
      const rect = overlayRef.current.getBoundingClientRect();
      const x = touch.clientX - rect.left - dragStart.x;
      const y = touch.clientY - rect.top - dragStart.y;
      const xPercent = (x / rect.width) * 100;
      const yPercent = (y / rect.height) * 100;
      setTextPosition({
        x: Math.max(0, Math.min(100, xPercent)),
        y: Math.max(0, Math.min(100, yPercent)),
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement("a");
      link.href = capturedImage;
      link.download = `capture-${Date.now()}.png`;
      link.click();
    }
  };

  const handleDrawClick = () => {
    setIsDrawMode(!isDrawMode);
    if (isTextMode) {
      setIsTextMode(false);
    }
  };

  const handleEffectClick = () => {
    console.log("Effects clicked - functionality coming soon");
  };

  const getDrawCoordinates = (e) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX, clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x, y };
  };

  const startDrawing = (e) => {
    if (!isDrawMode) return;
    e.preventDefault();
    setIsDrawing(true);
    const coords = getDrawCoordinates(e);
    setCurrentPath([coords]);
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawMode) return;
    e.preventDefault();
    const coords = getDrawCoordinates(e);
    setCurrentPath((prev) => [...prev, coords]);
  };

  return (
    <div
      className={`bottom-sheet ${isOpen ? "open" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {capturedImage && <img src={capturedImage} alt="Captured" className="background-image" />}

      <div className="text-overlay-container" ref={overlayRef}>
        {textOverlay && !isTextMode && (
          <div
            className="text-overlay"
            style={{
              left: `${textPosition.x}%`,
              top: `${textPosition.y}%`,
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsTextMode(true);
            }}
          >
            {textOverlay}
          </div>
        )}
        {isTextMode && (
          <input
            ref={textInputRef}
            className="text-input"
            type="text"
            placeholder="Type here..."
            value={textOverlay}
            onChange={(e) => setTextOverlay(e.target.value)}
            onKeyDown={handleTextSubmit}
            onBlur={() => setIsTextMode(false)}
            style={{
              left: `${textPosition.x}%`,
              top: `${textPosition.y}%`,
            }}
          />
        )}
      </div>

      <div className="sheet-header">
        <button className="close-button" onClick={onClose}>
          <FiX />
        </button>
      </div>

      <div className="right-panel">
        <button className={`icon-button ${isTextMode ? "active" : ""}`} onClick={handleTextClick}>
          <MdTextFields />
        </button>
        <button className={`icon-button ${isDrawMode ? "active" : ""}`} onClick={handleDrawClick}>
          <MdDraw />
        </button>
        <button className="icon-button" onClick={handleEffectClick}>
          <IoSparklesSharp />
        </button>
      </div>

      <div className="action-buttons">
        <div className="share-buttons">
          <button className="share-button tiktok" onClick={() => handleShare("tiktok")}>
            <FaTiktok />
          </button>

          <button className="share-button instagram" onClick={() => handleShare("instagram")}>
            <FaInstagram />
          </button>

          <button className="share-button facebook" onClick={() => handleShare("facebook")}>
            <FaFacebook />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareBottomSheet;
