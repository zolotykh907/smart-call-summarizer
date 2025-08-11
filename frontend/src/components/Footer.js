import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-900">Smart Call Summarizer</span>
              <span className="mx-2">•</span>
              <span>Автоматическое резюме созвонов и удобный разбор диалогов</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="text-gray-500">Поддерживаемые форматы: MP3, WAV, M4A, FLAC, OGG</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


