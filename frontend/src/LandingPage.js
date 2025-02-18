import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// Keyframe for fade-in animation
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Keyframe for button hover effect
const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

// Styled components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #6a11cb, #2575fc);
  color: white;
  text-align: center;
  padding: 20px;
  animation: ${fadeIn} 1s ease-in-out;
`;

const Title = styled.h1`
  font-size: 3rem;
  margin-bottom: 20px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  margin-bottom: 40px;
  color: rgba(255, 255, 255, 0.9);
`;

const GetStartedButton = styled.button`
  padding: 15px 30px;
  font-size: 1.2rem;
  color: #6a11cb;
  background: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  animation: ${fadeIn} 1.5s ease-in-out;

  &:hover {
    background: #f0f0f0;
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
    animation: ${pulse} 1s infinite;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Title>Welcome to Emotion Detection App</Title>
      <Subtitle>Discover the power of AI in understanding human emotions.</Subtitle>
      <GetStartedButton onClick={() => navigate('/analysis')}>
        Get Started
      </GetStartedButton>
    </Container>
  );
};

export default LandingPage;