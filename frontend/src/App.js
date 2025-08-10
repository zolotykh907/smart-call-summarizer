import React, { useState } from 'react';
import Header from './components/Header';
import AudioUpload from './components/AudioUpload';
import Results from './components/Results';
import LoadingSpinner from './components/LoadingSpinner';
import './index.css';

function App() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const resetResults = () => {
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!results && !loading && (
          <div className="animate-fade-in">
            <AudioUpload 
              onResults={handleResults}
              onError={handleError}
              onLoading={handleLoading}
            />
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
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
    </div>
  );
}

export default App;

