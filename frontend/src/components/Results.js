import React, { useState } from 'react';
import { Download, RotateCcw, FileText, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Results = ({ results, onReset }) => {
  const [activeTab, setActiveTab] = useState('summary');

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const downloadMarkdown = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadSummary = () => {
    downloadMarkdown(results.summary, 'summary.md');
  };

  const downloadDialogue = () => {
    let content = '# Текст созвона\n\n';
    results.dialogue.forEach((segment, index) => {
      const startTime = formatTime(segment.start);
      const endTime = formatTime(segment.end);
      content += `**${segment.speaker}** [${startTime} – ${endTime}]: ${segment.text}\n\n`;
    });
    downloadMarkdown(content, 'dialogue.md');
  };

  return (
    <div className="space-y-6">
      {/* Заголовок результатов */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Анализ завершен!
        </h2>
        <p className="text-gray-600">
          Результаты обработки вашего аудио файла
        </p>
      </div>

      {/* Кнопки действий */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onReset}
          className="btn-secondary inline-flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Загрузить новый файл</span>
        </button>
      </div>

      {/* Табы */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 justify-center">
          <button
            onClick={() => setActiveTab('summary')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center space-x-2
              ${activeTab === 'summary'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <FileText className="h-4 w-4" />
            <span>Резюме</span>
          </button>
          <button
            onClick={() => setActiveTab('dialogue')}
            className={`
              py-2 px-1 border-b-2 font-medium text-sm inline-flex items-center space-x-2
              ${activeTab === 'dialogue'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Диалог</span>
          </button>
        </nav>
      </div>

      {/* Контент табов */}
      <div className="animate-fade-in">
        {activeTab === 'summary' && (
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Анализ созвона
              </h3>
              <button
                onClick={downloadSummary}
                className="btn-secondary inline-flex items-center space-x-2 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Скачать</span>
              </button>
            </div>
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {results.summary}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {activeTab === 'dialogue' && (
          <div className="card">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Текст созвона с идентификацией спикеров
              </h3>
              <button
                onClick={downloadDialogue}
                className="btn-secondary inline-flex items-center space-x-2 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Скачать</span>
              </button>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.dialogue.map((segment, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary-500"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-primary-700">
                      {segment.speaker}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatTime(segment.start)} – {formatTime(segment.end)}
                    </span>
                  </div>
                  <p className="text-gray-800 leading-relaxed">
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600 mb-1">
            {results.dialogue.length}
          </div>
          <div className="text-sm text-gray-600">Кол-во сегментов диалога</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {new Set(results.dialogue.map(s => s.speaker)).size}
          </div>
          <div className="text-sm text-gray-600">Кол-во участников</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {Math.round((results.dialogue[results.dialogue.length - 1]?.end || 0) / 60)}
          </div>
          <div className="text-sm text-gray-600">Длительность</div>
        </div>
      </div>
    </div>
  );
};

export default Results;