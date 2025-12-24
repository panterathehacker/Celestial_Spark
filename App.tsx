import React, { useState, useCallback } from 'react';
import StarCanvas from './components/StarCanvas';
import SparkCard from './components/SparkCard';
import { generateConstellationMetadata, generateCardImage, editCardImage } from './services/geminiService';
import { Point, AppPhase, ConstellationMetadata } from './types';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.INTRO);
  const [selectedStars, setSelectedStars] = useState<Point[]>([]);
  // New state to track progress before final selection
  const [starCount, setStarCount] = useState(0); 
  const [constellationData, setConstellationData] = useState<ConstellationMetadata | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  // Key to force re-mounting of the canvas for a clean reset
  const [canvasKey, setCanvasKey] = useState(0);

  const startJourney = () => {
    setPhase(AppPhase.SELECTING);
    setSelectedStars([]);
    setStarCount(0);
    setConstellationData(null);
    setGeneratedImage(null);
    // Increment key to force StarCanvas to remount with fresh stars
    setCanvasKey(prev => prev + 1);
  };

  const handleStarProgress = useCallback((count: number) => {
    setStarCount(count);
  }, []);

  const handleStarsSelected = useCallback(async (stars: Point[]) => {
    setSelectedStars(stars);
    setPhase(AppPhase.GENERATING_METADATA);

    try {
      // 1. Generate Logic (Name, Horoscope, Prompt)
      const metadata = await generateConstellationMetadata(stars, window.innerWidth, window.innerHeight);
      setConstellationData(metadata);
      setPhase(AppPhase.GENERATING_IMAGE);

      // 2. Generate Image (Now passing stars for shape guidance)
      const imageBase64 = await generateCardImage(metadata.visualPrompt, stars);
      setGeneratedImage(imageBase64);
      setPhase(AppPhase.RESULT);

    } catch (error) {
      console.error("Failed to generate constellation:", error);
      alert("The stars are cloudy tonight. Please try gazing again.");
      setPhase(AppPhase.INTRO);
    }
  }, []);

  const handleEdit = async (instruction: string) => {
    if (!generatedImage) return;
    
    const previousPhase = phase;
    setPhase(AppPhase.EDITING);

    try {
        const newImageBase64 = await editCardImage(generatedImage, instruction);
        setGeneratedImage(newImageBase64);
        setPhase(AppPhase.RESULT);
    } catch (error) {
        console.error("Failed to edit image:", error);
        alert("The magic weave resisted the change. Try a different instruction.");
        setPhase(previousPhase); // Return to result state even if fail
    }
  };

  return (
    // Removed overflow-hidden to allow scrolling on mobile/small screens
    <div className="relative w-full h-full min-h-screen bg-mystic-900 text-white font-sans select-none overflow-y-auto">
      
      {/* Background Star Canvas - Always rendered but interactive only in SELECTING */}
      {/* Key ensures a fresh component (and fresh stars) on reset */}
      <StarCanvas 
        key={canvasKey}
        onStarsSelected={handleStarsSelected}
        onProgress={handleStarProgress}
        isActive={phase === AppPhase.SELECTING} 
      />

      {/* UI Overlay - pointer-events-none allows clicks to pass through to canvas */}
      <div className="relative z-10 w-full min-h-screen flex flex-col pointer-events-none">
        
        {/* Header Logo */}
        <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50 pointer-events-auto">
           <div className="flex items-center gap-2">
             {/* Yellow star icon removed */}
             <h1 className="text-xl md:text-2xl font-serif font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600">
               CELESTIAL SPARK
             </h1>
           </div>
        </header>

        {/* Phase: Intro */}
        {phase === AppPhase.INTRO && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fadeIn pointer-events-auto">
            <h2 className="text-4xl md:text-6xl font-serif text-yellow-100 mb-4 drop-shadow-lg">
              Discover Your <br/> <span className="text-yellow-500">2026 Horoscope</span>
            </h2>
            {/* Font unified to font-serif */}
            <p className="max-w-xl text-lg md:text-xl text-gray-300 mb-10 leading-relaxed font-serif">
              Forget generic predictions. Connect with the cosmos to create your own destiny. 
              Tap 5 stars to reveal a unique constellation and unlock a personalized forecast for the year ahead.
            </p>
            {/* Font unified to font-serif */}
            <button 
              onClick={startJourney}
              className="group relative px-10 py-5 bg-transparent border border-yellow-500 rounded-full text-yellow-500 text-xl font-bold font-serif tracking-wider overflow-hidden hover:text-mystic-900 transition-colors duration-300 shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)]"
            >
              <span className="absolute inset-0 w-full h-full bg-yellow-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
              <span className="relative z-10">REVEAL MY FUTURE</span>
            </button>
          </div>
        )}

        {/* Phase: Selecting */}
        {phase === AppPhase.SELECTING && (
          <div className="absolute bottom-10 w-full text-center pointer-events-none animate-bounce">
            <p className="text-yellow-200 text-lg bg-black/30 backdrop-blur-md inline-block px-4 py-2 rounded-full border border-yellow-500/30 shadow-lg font-serif">
              Tap <span className="text-yellow-400 font-bold text-xl mx-1">{Math.max(0, 5 - starCount)}</span> more stars to reveal your path...
            </p>
          </div>
        )}

        {/* Phase: Loading (Metadata or Image) */}
        {(phase === AppPhase.GENERATING_METADATA || phase === AppPhase.GENERATING_IMAGE) && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 z-50 bg-black/40 backdrop-blur-sm pointer-events-auto">
            <div className="relative w-24 h-24 mb-8">
               <div className="absolute inset-0 border-4 border-yellow-600/30 rounded-full"></div>
               <div className="absolute inset-0 border-4 border-t-yellow-500 rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
               </div>
            </div>
            <h3 className="text-2xl font-serif text-yellow-100 animate-pulse">
              {phase === AppPhase.GENERATING_METADATA ? "Consulting the Heavens..." : "Weaving Starlight..."}
            </h3>
            <p className="text-gray-400 mt-2 text-sm font-serif">
                Powered by Gemini & Nano Banana
            </p>
          </div>
        )}

        {/* Phase: Result (and Editing) */}
        {(phase === AppPhase.RESULT || phase === AppPhase.EDITING) && constellationData && generatedImage && (
          <SparkCard 
            metadata={constellationData} 
            imageBase64={generatedImage} 
            onEdit={handleEdit}
            onReset={startJourney}
            isEditing={phase === AppPhase.EDITING}
          />
        )}
      </div>
    </div>
  );
};

export default App;