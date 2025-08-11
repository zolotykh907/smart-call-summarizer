import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Header from './components/Header';
import Footer from './components/Footer';
import AudioUpload from './components/AudioUpload';
import Results from './components/Results';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [serverStep, setServerStep] = useState(null);
  const [serverMessage, setServerMessage] = useState(null);
  const [serverProgress, setServerProgress] = useState(0);
  const pollRef = useRef(null);
  const audioUrlRef = useRef(null);

  const handleResults = (data) => {
    setResults(data);
    setError(null);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setResults(null);
  };

  const handleLoading = (isLoading) => {
    setLoading(isLoading);
    if (isLoading) {
      setError(null);
    }
  };

  const handleJobStart = (newJobId, audioUrl) => {
    setJobId(newJobId);
    setLoading(true);
    audioUrlRef.current = audioUrl || null;
  };

  useEffect(() => {
    if (!jobId) return;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`/summary-audio/status/${jobId}`);
        if (data) {
          setServerStep(data.step || null);
          setServerMessage(data.message || null);
          setServerProgress(typeof data.progress === 'number' ? data.progress : 0);
          if (data.status === 'completed' && data.success) {
            setResults({ summary: data.summary, dialogue: data.dialogue, audioUrl: audioUrlRef.current });
            setJobId(null);
            setLoading(false);
            clearInterval(pollRef.current);
          } else if (data.status === 'error') {
            setError(data.error || 'Ошибка обработки');
            setJobId(null);
            setLoading(false);
            clearInterval(pollRef.current);
          }
        }
      } catch (e) {
        setError('Ошибка при получении статуса');
        setJobId(null);
        setLoading(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 1200);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId]);

  const resetResults = () => {
    setResults(null);
    setError(null);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header hasResults={Boolean(results)} onReset={resetResults} />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!results && !loading && (
          <div className="animate-fade-in">
            <AudioUpload 
              onResults={handleResults}
              onError={handleError}
              onLoading={handleLoading}
              onJobStart={handleJobStart}
            />
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner step={serverStep} message={serverMessage} progress={serverProgress} />
          </div>
        )}

        {error && (
          <div className="animate-slide-up">
            <div className="card max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Произошла ошибка
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button 
                  onClick={resetResults}
                  className="btn-primary"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>
        )}

        {results && !loading && (
          <div className="animate-fade-in">
            <Results 
              results={results}
              onReset={resetResults}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;

