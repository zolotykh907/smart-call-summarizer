import React, { useMemo } from 'react';
import { Loader2, Mic, Users, Brain, CheckCircle2 } from 'lucide-react';

const LoadingSpinner = ({ step, message, progress }) => {
  const steps = useMemo(() => ([
    { key: 'speech_recognition', icon: Mic, title: 'Распознавание речи', description: 'Обрабатываем аудио с помощью Whisper...', color: 'text-blue-600' },
    { key: 'speaker_identification', icon: Users, title: 'Идентификация спикеров', description: 'Определяем кто говорит с помощью Pyannote...', color: 'text-green-600' },
    { key: 'merge', icon: CheckCircle2, title: 'Сопоставление сегментов', description: 'Сливаем реплики и спикеров...', color: 'text-amber-600' },
    { key: 'summarization', icon: Brain, title: 'AI анализ', description: 'Создаем резюме с помощью Llama3...', color: 'text-purple-600' },
  ]), []);

  return (
    <div className="text-center">
      <div className="mb-8">
        <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Обрабатываем ваш файл...
        </h2>
        <div className="flex items-center justify-center gap-3 text-gray-600">
          <div className="h-2 w-48 bg-gray-200 rounded">
            <div className="h-2 bg-primary-600 rounded" style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }}></div>
          </div>
          <span className="text-sm">{Math.round(progress || 0)}%</span>
        </div>
        {message && (
          <p className="text-gray-600 mt-2">{message}</p>
        )}
      </div>

      <div className="max-w-md mx-auto">
        <div className="space-y-4">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isActive = s.key === step || (!step && index === 0);
            
            return (
              <div
                key={index}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all duration-300
                  ${isActive 
                    ? 'bg-white shadow-md border border-gray-200' 
                    : 'opacity-50'
                  }
                `}
              >
                <div className={`
                  p-2 rounded-lg
                  ${isActive ? s.color.replace('text-', 'bg-').replace('-600', '-100') : 'bg-gray-100'}
                `}>
                  <Icon className={`h-5 w-5 ${isActive ? s.color : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {s.title}
                  </h3>
                  <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                    {s.description}
                  </p>
                </div>
                {isActive && (
                  <div className="animate-pulse-slow">
                    <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>Не закрывайте эту страницу во время обработки</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

