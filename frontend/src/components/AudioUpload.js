import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, AlertCircle } from 'lucide-react';
import axios from 'axios';

const AudioUpload = ({ onResults, onError, onLoading, onJobStart }) => {
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith('audio/')) {
      onError('Пожалуйста, выберите аудио файл');
      return;
    }

    // Проверяем размер файла (максимум 100MB)
    if (file.size > 100 * 1024 * 1024) {
      onError('Размер файла не должен превышать 100MB');
      return;
    }

    onLoading(true);

    let jobStarted = false;
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Запускаем асинхронную задачу на сервере и получаем jobId
      const response = await axios.post('/summary-audio/start', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      });

      if (response.data && response.data.jobId) {
        jobStarted = true;
        if (onJobStart) onJobStart(response.data.jobId);
      } else if (response.data && response.data.success) {
        // совместимость со старым синхронным ответом
        onResults(response.data);
        onLoading(false);
      } else {
        onError('Ошибка при запуске обработки');
        onLoading(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = 'Произошла ошибка при загрузке файла';
      
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.detail || 'Неверный формат файла';
        } else if (error.response.status === 413) {
          errorMessage = 'Файл слишком большой';
        } else if (error.response.status === 500) {
          errorMessage = 'Ошибка сервера при обработке файла';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Превышено время ожидания. Попробуйте файл меньшего размера';
      } else if (!error.response) {
        errorMessage = 'Нет соединения с сервером';
      }
      
      onError(errorMessage);
      onLoading(false);
    } finally {
      // Если задача действительно запущена и управляется опросом статуса,
      // не выключаем загрузку здесь. Её выключит App после завершения/ошибки.
      if (jobStarted) return;
    }
  }, [onResults, onError, onLoading, onJobStart]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Загрузите аудио файл созвона
        </h2>
        <p className="text-lg text-gray-600">
          Поддерживаемые форматы: MP3, WAV, M4A, FLAC, OGG
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div
          {...getRootProps()}
          className={`
            card h-full cursor-pointer transition-all duration-200 border-2 border-dashed
            ${isDragActive && !isDragReject 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
            ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="text-center py-12">
            <div className="mb-4">
              {isDragReject ? (
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              ) : (
                <FileAudio className="h-12 w-12 text-primary-500 mx-auto" />
              )}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isDragActive 
                ? (isDragReject ? 'Неподдерживаемый файл' : 'Отпустите файл здесь')
                : 'Перетащите аудио файл сюда'
              }
            </h3>
            
            <p className="text-gray-600 mb-4">
              {isDragActive 
                ? (isDragReject ? 'Выберите аудио файл' : 'Файл будет загружен автоматически')
                : 'или нажмите для выбора файла'
              }
            </p>
            
            {!isDragActive && (
              <button className="btn-primary inline-flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Выбрать файл</span>
              </button>
            )}
          </div>
        </div>

        <div className="card h-full">
          <h4 className="font-semibold text-gray-900 mb-3">Как обрабатывается файл</h4>
          <ol className="space-y-3 text-gray-700">
            <li>
              <span className="font-medium">1. Распознается речь</span> — Whisper превращает аудио в текст
            </li>
            <li>
              <span className="font-medium">2. Определяются спикеры</span> — Pyannote выделяет участников разговора
            </li>
            <li>
              <span className="font-medium">3. Анализ</span> — Llama3 создает структурированное резюме
            </li>
          </ol>
          <div className="mt-4 text-sm text-gray-500">
            Время обработки зависит от длительности и качества записи.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioUpload;

