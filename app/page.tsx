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
  // -- State Management --
  const [mood, setMood] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Ref for the HTML Audio Element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // -- 1. Fetch Top Tracks (Leaderboard) --
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

  // -- 2. File Upload Logic --
  const onDrop = async (acceptedFiles: File[]) => {
    setUploadStatus('Uploading...');
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      // Simple logic to guess Artist/Title from filename (e.g. "Artist - Title.mp3")
      const nameParts = file.name.replace(/\.[^/.]+$/, "").split('-');
      const artist = nameParts.length > 1 ? nameParts[0].trim() : 'Unknown';
      const title = nameParts.length > 1 ? nameParts[1].trim() : nameParts[0].trim();
      
      formData.append('artist', artist);
      formData.append('title', title);

      try {
        await axios.post('/api/upload', formData);
      } catch (err) {
        console.error('Upload failed', err);
        setUploadStatus('Error uploading one or more files.');
      }
    }
    setUploadStatus('Upload Complete! Add more or start mixing.');
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: {'audio/*': ['.mp3', '.wav']} 
  });

  // -- 3. AI Mix Generation Logic --
  const generateMix = async () => {
    if (!mood) return alert('Please describe your mood first!');
    setIsGenerating(true);
    setPlaylist([]); // Reset player
    
    try {
      const res = await axios.post('/api/generate-mix', { mood });
      if (res.data.tracks && res.data.tracks.length > 0) {
        setPlaylist(res.data.tracks);
        setCurrentTrackIndex(0);
        setIsPlaying(true);
        // Refresh stats to show new popularity counts
        fetchTopTracks(); 
      }
    } catch (err) {
      alert('Failed to generate mix. Do you have enough songs uploaded?');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // -- 4. Player Logic --
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
      setIsPlaying(false); // End of playlist
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 text-transparent bg-clip-text">
            Mood DJ
          </h1>
          <p className="text-gray-400">AI-Powered Music Mixer</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column: Upload & Mix */}
          <div className="space-y-8">
            
            {/* Upload Section */}
            <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-purple-300">1. Upload Music</h2>
              <div {...getRootProps()} className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors">
                <input {...getInputProps()} />
                <p className="text-gray-300">Drag & drop MP3s here, or click to select</p>
              </div>
              {uploadStatus && <p className="mt-2 text-sm text-green-400">{uploadStatus}</p>}
            </section>

            {/* AI Console */}
            <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-purple-300">2. Describe Your Vibe</h2>
              <textarea 
                className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:outline-none focus:border-purple-500"
                rows={3}
                placeholder="e.g., 'Late night coding session with intense focus' or 'Sunday morning coffee'"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              />
              <button 
                onClick={generateMix}
                disabled={isGenerating}
                className={`w-full mt-4 py-3 rounded-lg font-bold text-lg transition-all ${
                  isGenerating ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isGenerating ? 'AI is Mixing...' : 'Generate Playlist'}
              </button>
            </section>
          </div>

          {/* Right Column: Player & Stats */}
          <div className="space-y-8">
            
            {/* Player */}
            <section className="bg-gray-800 p-6 rounded-xl border border-gray-700 min-h-[200px] flex flex-col justify-center items-center relative overflow-hidden">
              {playlist.length > 0 ? (
                <>
                  <div className="text-center z-10">
                    <h3 className="text-2xl font-bold mb-1">{playlist[currentTrackIndex].title}</h3>
                    <p className="text-purple-400 mb-6">{playlist[currentTrackIndex].artist}</p>
                    
                    <audio 
                      ref={audioRef}
                      src={`/api/stream/${playlist[currentTrackIndex]._id}`}
                      onEnded={handleTrackEnd}
                      controls
                      className="w-full"
                    />
                  </div>
                  {/* Playlist Queue */}
                  <div className="mt-6 w-full text-left">
                    <h4 className="text-xs uppercase tracking-widest text-gray-500 mb-2">Up Next</h4>
                    <ul className="text-sm space-y-2 text-gray-400">
                      {playlist.map((track, idx) => (
                        <li key={idx} className={`${idx === currentTrackIndex ? 'text-green-400 font-bold' : ''}`}>
                          {idx + 1}. {track.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-gray-500 text-center">
                  <p>No playlist generated yet.</p>
                  <p className="text-sm">Enter a mood to start.</p>
                </div>
              )}
            </section>

            {/* Leaderboard */}
            <section className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-purple-300">Top Tracks</h2>
              <ul className="space-y-3">
                {topTracks.map((track, idx) => (
                  <li key={track._id} className="flex justify-between items-center bg-gray-900 p-3 rounded">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-purple-500 font-bold">#{idx + 1}</span>
                      <div>
                        <p className="font-semibold text-sm">{track.title}</p>
                        <p className="text-xs text-gray-500">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                      {track.selectionCount} plays
                    </span>
                  </li>
                ))}
              </ul>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}