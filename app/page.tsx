'use client';

import { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface Track {
  _id: string;
  title: string;
  artist: string;
  selectionCount: number;
}

export default function Home() {
  const [mood, setMood] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchTopTracks = async () => {
    try {
      const res = await axios.get('/api/stats/top-tracks');
      setTopTracks(res.data);
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  useEffect(() => {
    fetchTopTracks();
  }, []);

  const onDrop = async (acceptedFiles: File[]) => {
    setUploadStatus('Uploading...');
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      // Clean filename logic
      const nameParts = file.name.replace(/\.[^/.]+$/, "").split('-');
      const artist = nameParts.length > 1 ? nameParts[0].trim() : 'Unknown Artist';
      const title = nameParts.length > 1 ? nameParts[1].trim() : nameParts[0].trim();
      
      formData.append('artist', artist);
      formData.append('title', title);

      try {
        await axios.post('/api/upload', formData);
      } catch (err) {
        console.error('Upload failed', err);
        setUploadStatus('Error uploading. Check file size.');
      }
    }
    setUploadStatus('✓ Upload Complete! Ready to mix.');
    setTimeout(() => setUploadStatus(''), 3000); // Clear message after 3s
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: {'audio/*': ['.mp3', '.wav']} 
  });

  const generateMix = async () => {
    if (!mood) return alert('Please describe your mood first!');
    setIsGenerating(true);
    setPlaylist([]);
    
    try {
      const res = await axios.post('/api/generate-mix', { mood });
      if (res.data.tracks && res.data.tracks.length > 0) {
        setPlaylist(res.data.tracks);
        setCurrentTrackIndex(0);
        setIsPlaying(true);
        fetchTopTracks(); 
      }
    } catch (err) {
      alert('Failed to generate mix. Ensure you have songs uploaded.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (audioRef.current && playlist.length > 0) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Playback interaction needed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [playlist, currentTrackIndex, isPlaying]);

  const handleTrackEnd = () => {
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-[#0a0a0a] to-black text-white font-sans selection:bg-purple-500 selection:text-white">
      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-12">
        
        {/* Hero Header */}
        <header className="text-center space-y-4 mb-12">
          <div className="inline-block animate-pulse">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-900/50 text-purple-300 border border-purple-700/50">
              AI-POWERED BETA
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Mood DJ
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
            Upload your library. Describe your vibe. Let AI curate the perfect flow.
          </p>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN (Input Zone) - Spans 7 cols */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Upload Card */}
            <section className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 overflow-hidden transition-all hover:border-purple-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-black/40 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-sm">1</span>
                  Upload Tracks
                </h2>
                
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ease-in-out
                    ${isDragActive 
                      ? 'border-purple-400 bg-purple-400/10 scale-[0.99]' 
                      : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
                    }`}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-2">
                    <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="text-sm text-gray-300 font-medium">Click to upload or drag MP3s here</p>
                    <p className="text-xs text-gray-500">Supports .mp3, .wav</p>
                  </div>
                </div>
                
                {/* Status Message with Animation */}
                <div className={`mt-4 overflow-hidden transition-all duration-500 ${uploadStatus ? 'max-h-10 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 bg-emerald-400/10 p-2 rounded-lg border border-emerald-400/20">
                    {uploadStatus}
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Mood & Generate Card */}
            <section className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1 overflow-hidden hover:border-pink-500/30 transition-all">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-black/40 rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-600 text-sm">2</span>
                  Set the Vibe
                </h2>
                
                <textarea 
                  className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-transparent transition-all resize-none text-lg"
                  rows={3}
                  placeholder="How are you feeling? (e.g., 'Late night drive', 'Gym beast mode')"
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                />

                <button 
                  onClick={generateMix}
                  disabled={isGenerating}
                  className={`relative w-full mt-6 py-4 rounded-xl font-bold text-lg tracking-wide shadow-xl overflow-hidden group/btn
                    ${isGenerating ? 'cursor-not-allowed opacity-80' : 'hover:scale-[1.02] active:scale-[0.98]'}
                    transition-all duration-200`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-300 ${isGenerating ? 'animate-pulse' : ''}`} />
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-20 bg-white transition-opacity" />
                  <span className="relative flex items-center justify-center gap-2">
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        DJ AI is Thinking...
                      </>
                    ) : (
                      <>
                        ✨ Generate Mix
                      </>
                    )}
                  </span>
                </button>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN (Player & Stats) - Spans 5 cols */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Player Card */}
            <section className={`relative bg-gradient-to-b from-gray-800 to-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 ${playlist.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale'}`}>
              
              {/* Vinyl Animation Effect */}
              <div className="absolute top-0 right-0 p-32 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

              <div className="relative p-8 flex flex-col items-center text-center z-10">
                <div className={`w-32 h-32 mb-6 rounded-full border-4 border-gray-800 shadow-2xl bg-gray-900 flex items-center justify-center relative overflow-hidden ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
                   <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] opacity-20" />
                   <div className="w-12 h-12 bg-gray-800 rounded-full border border-gray-700 z-10" />
                   <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 opacity-40 mix-blend-overlay" />
                </div>

                {playlist.length > 0 ? (
                  <>
                    <h3 className="text-2xl font-bold text-white mb-1 truncate w-full">{playlist[currentTrackIndex].title}</h3>
                    <p className="text-purple-400 font-medium mb-8">{playlist[currentTrackIndex].artist}</p>
                    
                    <audio 
                      ref={audioRef}
                      src={`/api/stream/${playlist[currentTrackIndex]._id}`}
                      onEnded={handleTrackEnd}
                      controls
                      className="w-full h-10 invert opacity-80 hover:opacity-100 transition-opacity"
                    />

                    <div className="mt-8 w-full text-left bg-black/30 rounded-lg p-4 max-h-[200px] overflow-y-auto custom-scrollbar">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Up Next</h4>
                      <ul className="space-y-2">
                        {playlist.map((track, idx) => (
                          <li 
                            key={idx} 
                            className={`text-sm p-2 rounded flex justify-between items-center transition-colors ${
                              idx === currentTrackIndex 
                                ? 'bg-purple-500/20 text-purple-300 border-l-2 border-purple-500' 
                                : 'text-gray-400 hover:bg-white/5'
                            }`}
                          >
                            <span className="truncate max-w-[80%]">{idx + 1}. {track.title}</span>
                            {idx === currentTrackIndex && <span className="text-[10px] animate-pulse">PLAYING</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 py-10">
                    <p className="text-lg">Waiting for vibes...</p>
                    <p className="text-xs mt-2 uppercase tracking-wider">Player Offline</p>
                  </div>
                )}
              </div>
            </section>

            {/* Leaderboard */}
            <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white/90">
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                Top Charts
              </h2>
              <div className="space-y-3">
                {topTracks.map((track, idx) => (
                  <div key={track._id} className="group flex items-center justify-between p-3 rounded-lg bg-black/40 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all cursor-default">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <span className={`font-mono font-bold text-lg ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate group-hover:text-purple-300 transition-colors">{track.title}</p>
                        <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-400 whitespace-nowrap">
                      {track.selectionCount} plays
                    </span>
                  </div>
                ))}
                {topTracks.length === 0 && <p className="text-gray-500 text-sm italic">No data yet.</p>}
              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}