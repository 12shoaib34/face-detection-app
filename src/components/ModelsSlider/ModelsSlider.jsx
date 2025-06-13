import React, { useState, useRef, useEffect } from "react";
import "./ModelsSlider.css";

const ModelsSlider = ({ onModelSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const itemRefs = useRef([]);
  const touchStartX = useRef(0);
  const scrollStartX = useRef(0);

  // Models array with preview images
  const models = [
    {
      id: "t1",
      name: "T1",
      previewImage: "/T1/t1-1.imageset/t1-1-removebg-preview.png",
      previewImageIndex: 2,

      images: [
        "/T1/t1-1.imageset/t1-1-removebg-preview.png",
        "/T1/t1-2.imageset/t1-2-removebg-preview.png",
        "/T1/t1-3.imageset/t1-3-removebg-preview.png",
        "/T1/t1-4.imageset/t1-4-removebg-preview.png",
        "/T1/t1-5.imageset/t1-5-removebg-preview.png",
        "/T1/t1-6.imageset/t1-6-removebg-preview.png",
        "/T1/t1-7.imageset/t1-7-removebg-preview.png",
      ],
    },
    {
      id: "t2",
      name: "T2",
      previewImage: "/T2/t2-1.imageset/t2-1-removebg-preview.png",
      previewImageIndex: 5,

      images: [
        "/T2/t2-1.imageset/t2-1-removebg-preview.png",
        "/T2/t2-2.imageset/t2-2-removebg-preview.png",
        "/T2/t2-3.imageset/t2-3-removebg-preview.png",
        "/T2/t2-4.imageset/t2-4-removebg-preview.png",
        "/T2/t2-5.imageset/t2-5-removebg-preview.png",
        "/T2/t2-6.imageset/t2-6-removebg-preview.png",
        "/T2/t2-7.imageset/t2-7-removebg-preview.png",
      ],
    },
    {
      id: "vipa",
      name: "Vipa",
      previewImage: "/Vipa/vipa-1.imageset/vipa-1-removebg-preview.png",
      previewImageIndex: 5,

      images: [
        "/Vipa/vipa-1.imageset/vipa-1-removebg-preview.png",
        "/Vipa/vipa-2.imageset/vipa-2-removebg-preview.png",
        "/Vipa/vipa-3.imageset/vipa-3-removebg-preview.png",
        "/Vipa/vipa-4.imageset/vipa-4-removebg-preview.png",
        "/Vipa/vipa-5.imageset/vipa-5-removebg-preview.png",
        "/Vipa/vipa-6.imageset/vipa-6-removebg-preview.png",
        "/Vipa/vipa-7.imageset/vipa-7-removebg-preview.png",
      ],
    },
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
    sliderRef.current.style.cursor = "grabbing";
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
      sliderRef.current.style.cursor = "grab";
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    if (sliderRef.current) {
      sliderRef.current.style.cursor = "grab";
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
            onClick={() => scrollToItem(index)}
          >
            <img src={model.images[model.previewImageIndex]} alt={model.name} className="model-image" />
            <span className="model-name">{model.name}</span>
          </div>
        ))}
        <div className="slider-padding"></div>
      </div>
    </div>
  );
};

export default ModelsSlider;
