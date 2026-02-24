import React from 'react';
import { Box, Layers, MessageSquare, Info } from 'lucide-react';

const MapToolbar = ({ viewMode, setViewMode, mapType, setMapType, isReviewMode, setIsReviewMode }) => {
    return (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-xl shadow-lg border border-white/40 flex flex-col gap-1">
                <button
                    onClick={() => setIsReviewMode(!isReviewMode)}
                    className={`p-2 rounded-lg transition-all ${isReviewMode ? 'bg-amber-500 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                    title="Review Mode & Governança"
                >
                    <MessageSquare className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setViewMode(viewMode === '2D' ? '2.5D' : '2D')}
                    className={`p-2 rounded-lg transition-all ${viewMode === '2.5D' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'}`}
                    title="Vista 2.5D"
                >
                    <Box className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setMapType(mapType === 'osm' ? 'satellite' : 'osm')}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-all"
                    title="Satélite"
                >
                    <Layers className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default MapToolbar;
