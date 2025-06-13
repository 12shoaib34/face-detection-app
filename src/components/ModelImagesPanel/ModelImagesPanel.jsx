import React, { useState, useRef, useEffect } from "react";
import "./ModelImagesPanel.css";

const ModelImagesPanel = ({ selectedModel, onImageSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const itemRefs = useRef([]);
  const touchStartY = useRef(0);
  const scrollStartY = useRef(0);

  if (!selectedModel) {
    return null;
  }

  useEffect(() => {
    // Center the initially selected item
    if (itemRefs.current[selectedIndex] && sliderRef.current) {
      const item = itemRefs.current[selectedIndex];
      const slider = sliderRef.current;
      const itemCenter = item.offsetTop + item.offsetHeight / 2;
      const sliderCenter = slider.offsetHeight / 2;
      slider.scrollTop = itemCenter - sliderCenter;
    }
  }, [selectedIndex]);

  const handleScroll = () => {
    if (!sliderRef.current) return;

    const slider = sliderRef.current;
    const sliderCenter = slider.scrollTop + slider.offsetHeight / 2;

    // Find which item is closest to the center
    let closestIndex = 0;
    let closestDistance = Infinity;

    itemRefs.current.forEach((item, index) => {
      if (item) {
        const itemCenter = item.offsetTop + item.offsetHeight / 2;
        const distance = Math.abs(itemCenter - sliderCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });

    if (closestIndex !== selectedIndex) {
      setSelectedIndex(closestIndex);
      if (onImageSelect) {
        onImageSelect(selectedModel.images[closestIndex]);
      }
    }
  };

  const scrollToItem = (index) => {
    if (itemRefs.current[index] && sliderRef.current) {
      const item = itemRefs.current[index];
      const slider = sliderRef.current;
      const itemCenter = item.offsetTop + item.offsetHeight / 2;
      const sliderCenter = slider.offsetHeight / 2;
      
      slider.scrollTo({
        top: itemCenter - sliderCenter,
        behavior: 'smooth'
      });
    }
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    scrollStartY.current = sliderRef.current.scrollTop;
  };

  const handleTouchMove = (e) => {
    if (!sliderRef.current) return;
    
    const touchDelta = touchStartY.current - e.touches[0].clientY;
    sliderRef.current.scrollTop = scrollStartY.current + touchDelta;
  };

  const handleTouchEnd = () => {
    // The handleScroll function will take care of snapping to the nearest item
  };

  // Mouse event handlers for desktop
  const handleMouseDown = (e) => {
    setIsDragging(true);
    touchStartY.current = e.clientY;
    scrollStartY.current = sliderRef.current.scrollTop;
    sliderRef.current.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    
    const mouseDelta = touchStartY.current - e.clientY;
    sliderRef.current.scrollTop = scrollStartY.current + mouseDelta;
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = 'grab';
    }
  };

  return (
    <div className="model-images-panel-container">
      <div className="center-frame"></div>
      <div 
        className="model-images-panel" 
        ref={sliderRef} 
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="slider-padding"></div>
        {selectedModel.images.map((image, index) => (
          <div
            key={index}
            ref={(el) => (itemRefs.current[index] = el)}
            className={`image-item ${index === selectedIndex ? "selected" : ""}`}
            onClick={() => scrollToItem(index)}
          >
            <img src={image} alt={`${selectedModel.name} ${index + 1}`} />
          </div>
        ))}
        <div className="slider-padding"></div>
      </div>
    </div>
  );
};

export default ModelImagesPanel;