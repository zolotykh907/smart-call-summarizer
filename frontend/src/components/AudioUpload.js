import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, AlertCircle } from 'lucide-react';
import axios from 'axios';

const AudioUpload = ({ onResults, onError, onLoading }) => {
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

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/summary-audio/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 минут таймаут
      });

      if (response.data.success) {
        onResults(response.data);
      } else {
        onError('Ошибка при обработке файла');
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
    } finally {
      onLoading(false);
    }
  }, [onResults, onError, onLoading]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.ogg']
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Загрузите аудио файл созвона
        </h2>
        <p className="text-lg text-gray-600">
          Поддерживаемые форматы: MP3, WAV, M4A, FLAC, OGG
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`
          card cursor-pointer transition-all duration-200 border-2 border-dashed
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

      <div className="mt-6 text-center">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Что происходит при обработке:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Распознавание речи с помощью Whisper</li>
            <li>• Идентификация спикеров с помощью Pyannote</li>
            <li>• Анализ и суммаризация с помощью Llama3</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AudioUpload;

