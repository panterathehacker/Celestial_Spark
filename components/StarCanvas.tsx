import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Star, Point } from '../types';

interface StarCanvasProps {
  onStarsSelected: (stars: Point[]) => void;
  onProgress: (count: number) => void;
  isActive: boolean;
}

const TOTAL_STARS = 80;
const CONNECTION_SPEED = 200; // ms per line (Faster animation)

const StarCanvas: React.FC<StarCanvasProps> = ({ onStarsSelected, onProgress, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  const [selectedStars, setSelectedStars] = useState<Star[]>([]);
  const [isAnimatingConnection, setIsAnimatingConnection] = useState(false);
  const animationFrameRef = useRef<number>(0);

  // Initialize stars on mount
  useEffect(() => {
    const initStars = () => {
      if (!canvasRef.current) return;
      const { width, height } = canvasRef.current.getBoundingClientRect();
      
      // Set actual canvas size to match display size for sharpness
      canvasRef.current.width = width;
      canvasRef.current.height = height;

      const newStars: Star[] = [];
      for (let i = 0; i < TOTAL_STARS; i++) {
        newStars.push({
          id: i,
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.3,
          isSelected: false,
        });
      }
      setStars(newStars);
    };

    initStars();
    window.addEventListener('resize', initStars);
    return () => window.removeEventListener('resize', initStars);
  }, []);

  // Handle Connecting Animation
  useEffect(() => {
    if (selectedStars.length === 5 && !isAnimatingConnection) {
      setIsAnimatingConnection(true);
      
      // Calculate delay based on faster speed
      const delay = (selectedStars.length * CONNECTION_SPEED) + 500;
      
      setTimeout(() => {
        onStarsSelected(selectedStars);
      }, delay);
    }
  }, [selectedStars, isAnimatingConnection, onStarsSelected]);

  // Main Draw Loop
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Lines
      if (selectedStars.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'; // Gold
        ctx.lineWidth = 2;
        
        // Use a counter based on time to animate the drawing if needed, 
        // but for simplicity and performance in this specific request, we draw all connected so far.
        // During the "isAnimatingConnection" phase, we could animate line by line, 
        // but the prompt asked for the transition time to be shorter.
        
        const limit = selectedStars.length;
        
        for (let i = 0; i < limit - 1; i++) {
          ctx.moveTo(selectedStars[i].x, selectedStars[i].y);
          ctx.lineTo(selectedStars[i + 1].x, selectedStars[i + 1].y);
        }
        ctx.stroke();
      }

      // Draw Stars
      stars.forEach((star) => {
        ctx.beginPath();
        // Check if this star instance is in the selected list (by ID)
        // Note: A star might be selected multiple times, but visually it highlights once
        const isSelected = selectedStars.some(s => s.id === star.id);
        
        // Selected stars pulse and are larger/gold
        if (isSelected) {
            ctx.fillStyle = `rgba(255, 215, 0, 1)`;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#FFD700';
            ctx.arc(star.x, star.y, star.size * 2.5, 0, Math.PI * 2);
        } else {
            // Background stars twinkle
            const twinkle = Math.random() * 0.2;
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, star.alpha + (Math.random() > 0.9 ? twinkle : 0)) )})`;
            ctx.shadowBlur = 0;
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.shadowBlur = 0; // Reset
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [stars, selectedStars]);

  const handleCanvasInteraction = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive || selectedStars.length >= 5) return;

    // Prevent default to stop browser specific gestures or double-firing events
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find closest star
    let closestStar: Star | null = null;
    let minDist = 50; // Hit radius

    stars.forEach(star => {
      const dist = Math.sqrt(Math.pow(star.x - x, 2) + Math.pow(star.y - y, 2));
      if (dist < minDist) {
        minDist = dist;
        closestStar = star;
      }
    });

    if (closestStar) {
      const s = closestStar as Star;
      // ALLOW selecting the same star multiple times
      const newSelection = [...selectedStars, s];
      setSelectedStars(newSelection);
      onProgress(newSelection.length);
    }
  }, [isActive, selectedStars, stars, onProgress]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 w-full h-full cursor-pointer touch-none transition-opacity duration-1000 ${isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onPointerDown={handleCanvasInteraction}
    />
  );
};

export default StarCanvas;