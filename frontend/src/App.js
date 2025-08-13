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
  const cancellingRef = useRef(false);

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
      // Сбрасываем прогресс/этапы перед новым запуском, чтобы не мигало 100%
      setServerStep(null);
      setServerMessage(null);
      setServerProgress(0);
    }
  };

  const handleJobStart = (newJobId, audioUrl, flags) => {
    // Дополнительный сброс на старте job, на случай если handleLoading уже отработал раньше
    setServerStep(null);
    setServerMessage(null);
    setServerProgress(0);

    setJobId(newJobId);
    setLoading(true);
    audioUrlRef.current = audioUrl || null;
    // сохраняем флаги для спиннера
    setResults({ __flags: flags });
  };

  const handleCancel = async () => {
    if (!jobId || cancellingRef.current) return;
    cancellingRef.current = true;
    try {
      await axios.post(`/summary-audio/cancel/${jobId}`);
    } catch (_) {
      // ignore network/server errors on cancel
    } finally {
      if (pollRef.current) clearInterval(pollRef.current);
      setJobId(null);
      setLoading(false);
      setServerMessage('Отменено пользователем');
      setServerStep('cancelled');
      setServerProgress(0);
      if (audioUrlRef.current) {
        try { URL.revokeObjectURL(audioUrlRef.current); } catch (_) {}
        audioUrlRef.current = null;
      }
      cancellingRef.current = false;
    }
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
            const r = { audioUrl: audioUrlRef.current };
            if (typeof data.summary !== 'undefined') r.summary = data.summary;
            if (typeof data.dialogue !== 'undefined') r.dialogue = data.dialogue;
            if (typeof data.actions !== 'undefined') r.actions = data.actions;
            setResults(r);
            setJobId(null);
            setLoading(false);
            clearInterval(pollRef.current);
          } else if (data.status === 'error') {
            setError(data.error || 'Ошибка обработки');
            setJobId(null);
            setLoading(false);
            clearInterval(pollRef.current);
          } else if (data.status === 'cancelled') {
            setServerStep('cancelled');
            setServerMessage('Отменено пользователем');
            setJobId(null);
            setLoading(false);
            clearInterval(pollRef.current);
            if (audioUrlRef.current) {
              try { URL.revokeObjectURL(audioUrlRef.current); } catch (_) {}
              audioUrlRef.current = null;
            }
          }
        }
      } catch (e) {
        setError('Ошибка при получении статуса');
        setJobId(null);
        setLoading(false);
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 400);

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
          <div className="flex flex-col justify-center items-center py-20">
            <LoadingSpinner 
              step={serverStep} 
              message={serverMessage} 
              progress={serverProgress}
              flags={(results && results.__flags) || { summary: true, dialogue: true, actions: true }}
            />
            <button onClick={handleCancel} className="btn-secondary mt-6">Отменить</button>
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

