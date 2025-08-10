import React, { useState, useEffect } from 'react';
import { Loader2, Mic, Users, Brain } from 'lucide-react';

const LoadingSpinner = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      icon: Mic,
      title: 'Распознавание речи',
      description: 'Обрабатываем аудио с помощью Whisper...',
      color: 'text-blue-600'
    },
    {
      icon: Users,
      title: 'Идентификация спикеров',
      description: 'Определяем кто говорит с помощью Pyannote...',
      color: 'text-green-600'
    },
    {
      icon: Brain,
      title: 'AI анализ',
      description: 'Создаем резюме с помощью Llama3...',
      color: 'text-purple-600'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="text-center">
      <div className="mb-8">
        <Loader2 className="h-16 w-16 text-primary-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Обрабатываем ваш файл...
        </h2>
        <p className="text-gray-600">
          Это может занять несколько минут в зависимости от размера файла
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            
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
                  ${isActive ? step.color.replace('text-', 'bg-').replace('-600', '-100') : 'bg-gray-100'}
                `}>
                  <Icon className={`h-5 w-5 ${isActive ? step.color : 'text-gray-400'}`} />
                </div>
                <div className="flex-1 text-left">
                  <h3 className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                    {step.description}
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

