import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const AnalysisPage = () => {
  const webcamRef = useRef(null);
  const [emotion, setEmotion] = useState("Click 'Start Analysis'");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emotionData, setEmotionData] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
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

  const stopAnalysis = async () => {
    setIsAnalyzing(false);
    clearInterval(intervalRef.current);
    setEmotion("Analysis Stopped");

    // Fetch suggestions based on the emotion data
    try {
      const response = await fetch("http://127.0.0.1:5000/get_suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion_data: emotionData }),
      });

      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const downloadReport = () => {
    const chartContainer = document.getElementById("chart-container");

    if (chartContainer) {
      html2canvas(chartContainer).then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("landscape");

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

        pdf.setFontSize(20);
        pdf.text("Emotion Detection Report", 10, 20);

        pdf.save("emotion_detection_report.pdf");
      });
    }
  };

  // Get emotion color for styling
  const getEmotionColor = (emotionType) => {
    const colors = {
      happy: "#FFD700", // Gold
      sad: "#4169E1",   // Royal Blue
      angry: "#FF4500", // OrangeRed
      surprise: "#9932CC", // DarkOrchid
      fear: "#800000",  // Maroon
      neutral: "#808080", // Gray
      disgust: "#006400", // DarkGreen
      "Analysis Stopped": "#B0C4DE", // LightSteelBlue
      "Detecting...": "#B0C4DE", // LightSteelBlue
      "Click 'Start Analysis'": "#B0C4DE", // LightSteelBlue
    };
    return colors[emotionType.toLowerCase()] || "#B0C4DE";
  };

  return (
    <div className="analysis-container" style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={titleStyle}>Emotion Analysis Dashboard</h1>
      </header>
      
      <main style={mainStyle}>
        <section style={webcamSectionStyle}>
          <h2 style={sectionTitleStyle}>Live Camera Feed</h2>
          <div style={webcamContainerStyle}>
            <Webcam 
              ref={webcamRef} 
              screenshotFormat="image/jpeg" 
              width="100%" 
              height="100%" 
              style={webcamStyle}
            />
          </div>
          
          <div style={{
            ...emotionCardStyle,
            backgroundColor: getEmotionColor(emotion),
            color: ['happy', 'surprise'].includes(emotion.toLowerCase()) ? '#333' : '#fff'
          }}>
            <h3>Current Emotion</h3>
            <p style={emotionTextStyle}>{emotion}</p>
          </div>
          
          <div style={controlsStyle}>
            <button 
              onClick={startAnalysis} 
              disabled={isAnalyzing} 
              style={{
                ...buttonStyle,
                opacity: isAnalyzing ? 0.6 : 1,
                backgroundColor: "#4CAF50" // Green
              }}
            >
              Start Analysis
            </button>
            <button 
              onClick={stopAnalysis} 
              disabled={!isAnalyzing} 
              style={{
                ...buttonStyle,
                opacity: !isAnalyzing ? 0.6 : 1,
                backgroundColor: "#f44336" // Red
              }}
            >
              Stop Analysis
            </button>
          </div>
        </section>
        
        <section style={suggestionsSectionStyle}>
          <h2 style={sectionTitleStyle}>Analysis Results</h2>
          
          {suggestions.length > 0 ? (
            <div style={suggestionsCardStyle}>
              <h3 style={suggestionsHeaderStyle}>Personalized Suggestions</h3>
              <ul style={suggestionsListStyle}>
                {suggestions.map((suggestion, index) => (
                  <li key={index} style={suggestionItemStyle}>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{...suggestionsCardStyle, justifyContent: 'center', alignItems: 'center'}}>
              <p style={{fontSize: '1.1rem', color: '#777'}}>
                Complete the analysis to receive personalized suggestions.
              </p>
            </div>
          )}
          
          <div id="chart-container" style={chartContainerStyle}>
            <h3 style={{marginBottom: '20px', color: '#333'}}>Emotion Frequency</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emotionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="emotion" tick={{fill: '#333'}} />
                <YAxis tick={{fill: '#333'}} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="#8884d8" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
            
            <button onClick={downloadReport} style={{
              ...buttonStyle,
              marginTop: '20px',
              backgroundColor: "#2196F3" // Blue
            }}>
              Download Report
            </button>
          </div>
        </section>
      </main>
      
      <footer style={footerStyle}>
        <p>© {new Date().getFullYear()} Emotion Analysis Dashboard</p>
      </footer>
    </div>
  );
};

// Styles
const containerStyle = {
  fontFamily: "'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
  maxWidth: '1400px',
  margin: '0 auto',
  padding: '0',
  backgroundColor: '#f9f9f9',
  color: '#333',
  boxShadow: '0 0 20px rgba(0,0,0,0.1)',
  borderRadius: '8px',
  overflow: 'hidden',
};

const headerStyle = {
  padding: '20px 40px',
  background: 'linear-gradient(to right, #6A11CB, #2575FC)',
  color: 'white',
  textAlign: 'left',
  borderBottom: '1px solid #e0e0e0',
};

const titleStyle = {
  fontSize: '2.2rem',
  margin: '0',
  fontWeight: '600',
  letterSpacing: '0.5px',
};

const mainStyle = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  padding: '30px',
  gap: '30px',
};

const sectionTitleStyle = {
  fontSize: '1.5rem',
  fontWeight: '500',
  marginBottom: '20px',
  color: '#444',
  borderBottom: '2px solid #eaeaea',
  paddingBottom: '10px',
};

const webcamSectionStyle = {
  flex: '1',
  minWidth: '350px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const webcamContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
};

const webcamStyle = {
  objectFit: 'cover',
  width: '100%',
  height: '100%',
};

const emotionCardStyle = {
  marginTop: '20px',
  padding: '15px 25px',
  borderRadius: '12px',
  width: '80%',
  textAlign: 'center',
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
};

const emotionTextStyle = {
  fontSize: '1.8rem',
  fontWeight: '600',
  margin: '10px 0',
  textTransform: 'capitalize',
};

const controlsStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '15px',
  marginTop: '25px',
  width: '100%',
};

const buttonStyle = {
  padding: '12px 24px',
  fontSize: '1rem',
  fontWeight: '500',
  cursor: 'pointer',
  borderRadius: '8px',
  border: 'none',
  color: 'white',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  outline: 'none',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const suggestionsSectionStyle = {
  flex: '1.5',
  minWidth: '500px',
  display: 'flex',
  flexDirection: 'column',
  gap: '30px',
};

const suggestionsCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '25px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  minHeight: '200px',
  display: 'flex',
  flexDirection: 'column',
};

const suggestionsHeaderStyle = {
  fontSize: '1.3rem',
  color: '#444',
  marginBottom: '15px',
  fontWeight: '500',
  textAlign: 'center',
};

const suggestionsListStyle = {
  listStyleType: 'none',
  padding: '0',
  margin: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const suggestionItemStyle = {
  padding: '15px 20px',
  backgroundColor: '#f7f9fc',
  borderRadius: '8px',
  fontSize: '1.05rem',
  lineHeight: '1.5',
  boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
  borderLeft: '4px solid #6A11CB',
};

const chartContainerStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '25px',
  boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const footerStyle = {
  padding: '20px',
  backgroundColor: '#f0f0f0',
  textAlign: 'center',
  color: '#777',
  fontSize: '0.9rem',
  borderTop: '1px solid #e0e0e0',
};

export default AnalysisPage;