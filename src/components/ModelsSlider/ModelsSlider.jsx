import React, { useState, useRef, useEffect } from "react";
import "./ModelsSlider.css";

const ModelsSlider = ({ onModelSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const itemRefs = useRef([]);
  const touchStartX = useRef(0);
  const scrollStartX = useRef(0);

  // Placeholder models array
  const models = [
    { id: 1, name: "Model 1", color: "#FF6B6B" },
    { id: 2, name: "Model 2", color: "#4ECDC4" },
    { id: 3, name: "Model 3", color: "#45B7D1" },
    { id: 4, name: "Model 4", color: "#96CEB4" },
    { id: 5, name: "Model 5", color: "#DDA0DD" },
    { id: 6, name: "Model 6", color: "#FFD93D" },
    { id: 7, name: "Model 7", color: "#6C5CE7" },
    { id: 8, name: "Model 8", color: "#A8E6CF" },
  ];

  useEffect(() => {
    // Center the initially selected item
    if (itemRefs.current[selectedIndex] && sliderRef.current) {
      const item = itemRefs.current[selectedIndex];
      const slider = sliderRef.current;
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const sliderCenter = slider.offsetWidth / 2;
      slider.scrollLeft = itemCenter - sliderCenter;
    }
  }, [selectedIndex]);

  const handleScroll = () => {
    if (!sliderRef.current) return;

    const slider = sliderRef.current;
    const sliderCenter = slider.scrollLeft + slider.offsetWidth / 2;

    // Find which item is closest to the center
    let closestIndex = 0;
    let closestDistance = Infinity;

    itemRefs.current.forEach((item, index) => {
      if (item) {
        const itemCenter = item.offsetLeft + item.offsetWidth / 2;
        const distance = Math.abs(itemCenter - sliderCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    });

    if (closestIndex !== selectedIndex) {
      setSelectedIndex(closestIndex);
      if (onModelSelect) {
        onModelSelect(models[closestIndex]);
      }
    }
  };

  const scrollToItem = (index) => {
    if (itemRefs.current[index] && sliderRef.current) {
      const item = itemRefs.current[index];
      const slider = sliderRef.current;
      const itemCenter = item.offsetLeft + item.offsetWidth / 2;
      const sliderCenter = slider.offsetWidth / 2;

      slider.scrollTo({
        left: itemCenter - sliderCenter,
        behavior: "smooth",
      });
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    scrollStartX.current = sliderRef.current.scrollLeft;
  };

  const handleTouchMove = (e) => {
    if (!sliderRef.current) return;

    const touchDelta = touchStartX.current - e.touches[0].clientX;
    sliderRef.current.scrollLeft = scrollStartX.current + touchDelta;
  };

  const handleTouchEnd = () => {
    // The handleScroll function will take care of snapping to the nearest item
  };

  // Mouse event handlers for desktop
  const handleMouseDown = (e) => {
    setIsDragging(true);
    touchStartX.current = e.clientX;
    scrollStartX.current = sliderRef.current.scrollLeft;
    sliderRef.current.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sliderRef.current) return;
    
    const mouseDelta = touchStartX.current - e.clientX;
    sliderRef.current.scrollLeft = scrollStartX.current + mouseDelta;
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
    <div className="models-slider-container">
      <div className="center-frame"></div>
      <div
        className="models-slider"
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
        {models.map((model, index) => (
          <div
            key={model.id}
            ref={(el) => (itemRefs.current[index] = el)}
            className={`model ${index === selectedIndex ? "selected" : ""}`}
            style={{ backgroundColor: model.color }}
            onClick={() => scrollToItem(index)}
          >
            {/* <span className="model-name">{model.name}</span>  don't uncomment this line */}
          </div>
        ))}
        <div className="slider-padding"></div>
      </div>
    </div>
  );
};

export default ModelsSlider;
