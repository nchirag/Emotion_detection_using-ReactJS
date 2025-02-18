import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import 'jspdf-autotable'; 

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

  const downloadReport = () => {
    // Capture the chart container
    const chartContainer = document.getElementById("chart-container");
  
    if (chartContainer) {
      html2canvas(chartContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("landscape");
  
        // Add a title to the PDF
        pdf.setFontSize(20);
        pdf.text("Emotion Detection Report", 10, 20);
  
        // Add the chart image to the PDF
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 10, 30, pdfWidth - 20, pdfHeight);
  
        // Add emotion data in a table below the chart
        pdf.setFontSize(12);
        const tableStartY = 30 + pdfHeight + 10; // Add space after the chart
        pdf.text("Emotion Frequency Table:", 10, tableStartY);
        const tableData = emotionData.map((item, index) => [item.emotion, item.count]);
  
        // Set table headers
        pdf.autoTable({
          startY: tableStartY + 10, // Start after the title
          head: [["Emotion", "Count"]],
          body: tableData,
          theme: "grid",
          styles: { fontSize: 12 },
          headStyles: { fillColor: [0, 0, 255], textColor: [255, 255, 255] },
          margin: { top: 5, left: 10, right: 10 },
          columnStyles: { 0: { halign: "center" }, 1: { halign: "center" } },
        });
  
        // Save the formatted PDF
        pdf.save("emotion_detection_report.pdf");
      });
    }
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
      <div id="chart-container">
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

      <button onClick={downloadReport} style={buttonStyle}>
        Download Report
      </button>
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