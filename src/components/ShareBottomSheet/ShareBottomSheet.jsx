import React from "react";
import "./ShareBottomSheet.css";
import { IoClose } from "react-icons/io5";
import { FaCamera, FaTiktok, FaInstagram, FaFacebook } from "react-icons/fa";
import { HiDownload } from "react-icons/hi";
import { FiX } from "react-icons/fi";

const ShareBottomSheet = ({ isOpen, onClose, capturedImage }) => {
  if (!isOpen) return null;

  const handleShare = (platform) => {
    // Placeholder for sharing functionality
    console.log(`Sharing to ${platform}`);
    // In a real app, you would implement platform-specific sharing here
  };

  const handleDownload = () => {
    if (capturedImage) {
      const link = document.createElement("a");
      link.href = capturedImage;
      link.download = `capture-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className={`bottom-sheet ${isOpen ? "open" : ""}`}>
      {capturedImage && <img src={capturedImage} alt="Captured" className="background-image" />}

      <div className="sheet-content">
        <div className="sheet-header">
          <div className="app-logo">
            <img src="/rebel-logo.svg" alt="" />
          </div>
          <button className="close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div className="action-buttons">
          <div className="share-buttons">
            <button className="share-button tiktok" onClick={() => handleShare("tiktok")}>
              <FaTiktok />
              <span>TikTok</span>
            </button>

            <button className="share-button instagram" onClick={() => handleShare("instagram")}>
              <FaInstagram />
              <span>Instagram</span>
            </button>

            <button className="share-button facebook" onClick={() => handleShare("facebook")}>
              <FaFacebook />
              <span>Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareBottomSheet;
