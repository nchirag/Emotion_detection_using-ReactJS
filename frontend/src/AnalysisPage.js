import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const AnalysisPage = () => {
  const webcamRef = useRef(null);
  const [emotion, setEmotion] = useState("Click 'Start Analysis'");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionData, setEmotionData] = useState([]);
  let intervalRef = useRef(null);

  const captureAndAnalyze = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });

      const data = await response.json();
      if (data.emotion) {
        setEmotion(data.emotion);
        saveImage(imageSrc, data.emotion);
        updateEmotionData(data.emotion);
      } else {
        setEmotion("No face detected");
      }
    } catch (error) {
      console.error("Error detecting emotion:", error);
      setEmotion("Error detecting emotion");
    }
  };

  const saveImage = async (imageSrc, detectedEmotion) => {
    try {
      await fetch("http://127.0.0.1:5000/save_image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc, filename: detectedEmotion }),
      });
    } catch (error) {
      console.error("Error saving image:", error);
    }
  };

  const updateEmotionData = (newEmotion) => {
    setEmotionData((prevData) => {
      const emotionIndex = prevData.findIndex((item) => item.emotion === newEmotion);
      if (emotionIndex !== -1) {
        const updatedData = [...prevData];
        updatedData[emotionIndex].count += 1;
        return updatedData;
      } else {
        return [...prevData, { emotion: newEmotion, count: 1 }];
      }
    });
  };

  const startAnalysis = () => {
    if (!isAnalyzing) {
      setEmotion("Detecting...");
      setIsAnalyzing(true);
      intervalRef.current = setInterval(captureAndAnalyze, 3000);
    }
  };

  const stopAnalysis = () => {
    setIsAnalyzing(false);
    clearInterval(intervalRef.current);
    setEmotion("Analysis Stopped");
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Live Emotion Detection</h2>
      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width="400" height="300" />
      <h3>Detected Emotion: {emotion}</h3>
      <button onClick={startAnalysis} disabled={isAnalyzing} style={buttonStyle}>
        Start Analysis
      </button>
      <button onClick={stopAnalysis} disabled={!isAnalyzing} style={buttonStyle}>
        Stop Analysis
      </button>

      <h3>Emotion Frequency Chart</h3>
      <ResponsiveContainer width="90%" height={300}>
        <BarChart data={emotionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="emotion" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const buttonStyle = {
  margin: "10px",
  padding: "10px 20px",
  fontSize: "16px",
  cursor: "pointer",
  borderRadius: "5px",
  border: "none",
  backgroundColor: "#007BFF",
  color: "white",
};

export default AnalysisPage;
