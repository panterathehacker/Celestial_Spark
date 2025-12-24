import React, { useState } from 'react';
import { ConstellationMetadata } from '../types';

interface SparkCardProps {
  metadata: ConstellationMetadata;
  imageBase64: string;
  onEdit: (instruction: string) => void;
  onReset: () => void;
  isEditing: boolean;
}

const SparkCard: React.FC<SparkCardProps> = ({ metadata, imageBase64, onEdit, onReset, isEditing }) => {
  const [editPrompt, setEditPrompt] = useState('');

  const handleDownload = () => {
    const link = document.createElement('a');
    // Using image/jpeg as gemini-2.5-flash-image typically returns jpegs
    link.href = `data:image/jpeg;base64,${imageBase64}`;
    link.download = `celestial-spark-${metadata.name.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPrompt.trim()) {
      onEdit(editPrompt);
      setEditPrompt('');
    }
  };

  return (
    <div className="z-20 relative flex flex-col items-center justify-center w-full min-h-screen py-8 px-4 animate-fadeIn pointer-events-auto">
      {/* Title - Kept per request */}
      <h2 className="text-3xl md:text-5xl font-serif text-mystic-gold gold-glow mb-6 text-center drop-shadow-md">
        {metadata.name}
      </h2>

      {/* Card Container */}
      <div className="relative group w-full max-w-sm rounded-xl p-1 bg-gradient-to-br from-yellow-600 via-yellow-200 to-yellow-700 shadow-[0_0_30px_rgba(255,215,0,0.3)]">
        <div className="bg-mystic-900 rounded-lg overflow-hidden relative">
          
          {/* Main Image */}
          <div className="relative aspect-[3/4] w-full overflow-hidden">
             {isEditing && (
                 <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                     <div className="flex flex-col items-center">
                         <div className="w-8 h-8 border-4 border-mystic-gold border-t-transparent rounded-full animate-spin mb-2"></div>
                         <p className="text-mystic-gold font-serif">Weaving new magic...</p>
                     </div>
                 </div>
             )}
            <img 
              src={`data:image/jpeg;base64,${imageBase64}`} 
              alt={metadata.name} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          
          {/* Note: HTML Text overlay removed so the AI-generated text on the card image is visible */}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center w-full max-w-md gap-4">
        
        {/* Edit Form */}
        <form onSubmit={handleEditSubmit} className="w-full flex gap-2">
            <input 
                type="text" 
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g. 'Add a retro glitch effect'..."
                className="flex-1 bg-mystic-800 border border-yellow-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-500 font-sans shadow-inner"
                disabled={isEditing}
            />
            <button 
                type="submit"
                disabled={isEditing || !editPrompt.trim()}
                className="bg-yellow-600 hover:bg-yellow-500 text-mystic-900 font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
                Edit
            </button>
        </form>

        <div className="flex gap-4 w-full">
            <button
            onClick={handleDownload}
            disabled={isEditing}
            className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-mystic-900 font-bold py-3 px-6 rounded-lg shadow-[0_0_15px_rgba(250,204,21,0.4)] transform transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
            Download Card
            </button>

            <button
            onClick={onReset}
            disabled={isEditing}
            className="flex-1 border border-yellow-500/50 text-yellow-100 hover:bg-yellow-500/10 font-bold py-3 px-6 rounded-lg transition-colors"
            >
            Dream Again
            </button>
        </div>
      </div>
    </div>
  );
};

export default SparkCard;