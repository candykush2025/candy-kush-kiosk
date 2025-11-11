"use client";
import { useEffect } from "react";

export default function ModelPreview({
  modelUrl,
  rotationX,
  rotationY,
  rotationZ,
  autoRotate = false,
}) {
  useEffect(() => {
    // Load model-viewer script if not already loaded
    if (typeof window !== "undefined") {
      if (!document.querySelector('script[src*="model-viewer"]')) {
        const script = document.createElement("script");
        script.type = "module";
        script.src =
          "https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js";
        document.head.appendChild(script);
      }
    }
  }, []);

  if (!modelUrl) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        No 3D model uploaded
      </div>
    );
  }

  return (
    <div className="w-full h-64 bg-white rounded-lg border-2 border-gray-200">
      <model-viewer
        src={modelUrl}
        alt="3D Model Preview"
        camera-controls
        camera-orbit={`${rotationX || 90}deg ${rotationY || 75}deg ${
          rotationZ || 3.5
        }m`}
        interaction-prompt="none"
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1"
        auto-rotate={autoRotate}
        min-camera-orbit="auto auto 0.5m"
        max-camera-orbit="auto auto 50m"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#ffffff",
        }}
        loading="eager"
        reveal="auto"
      ></model-viewer>
    </div>
  );
}
