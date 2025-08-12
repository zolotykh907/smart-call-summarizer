# Smart Call Summarizer

<div align="center" style="margin: 20px 0;">
  <img src="https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white&logoWidth=40" alt="Python" height="30">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&logoWidth=40" alt="Docker" height="30">
  <img src="https://img.shields.io/badge/Llama3-FF6600?logo=meta&logoColor=white&logoWidth=40" alt="Llama3" height="30">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&logoWidth=40" alt="FastAPI" height="30">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white&logoWidth=40" alt="React" height="30">
  <img src="https://img.shields.io/badge/Whisper-000000?logo=openai&logoColor=white&logoWidth=40" alt="Whisper" height="30">
  <img src="https://img.shields.io/badge/Pyannote-FF6F61?logo=python&logoColor=white&logoWidth=40" alt="Pyannote" height="30">
</div>

Интеллектуальный сервис для анализа и суммаризации созвонов с современным веб-интерфейсом.  


Система:
* Принимает аудиофайл созвона.
* Выполняет автоматическую транскрибацию речи (`Whisper`).
* Определяет участников разговора и разделяет их реплики (`Pyannote`).
* Выделяет ключевые моменты и цель созвона.
* Генерирует краткое резюме с помощью `Llama3` и предоставляет полный текст с временными метками.
* Использует `React` - удобный веб-интерфейс для взаимодействия.

!["video"](images/output.gif)

# 🌐 Архитектура веб-приложения

Система состоит из двух основных интерфейсов:

### 1. React Frontend
Современный веб-интерфейс:
- 📁 **Drag & Drop** загрузка аудиофайлов.
- 🔍 Индикация этапов обработки.
- 📄 Просмотр резюме и полного диалога.
- 💾 Скачивание результатов в Markdown.
- 📊 Статистика по длительности и количеству участников.
- 🎨 Адаптивный дизайн.

**Доступ**: http://localhost:3000

### 2. API Backend
Сервер на **FastAPI**:
- 🔧 REST API для загрузки и обработки аудиофайлов.
- 📖 Интерактивная документация Swagger.
- 🔒 Валидация данных.

**Доступ:** http://localhost:8000  
**Документация:** http://localhost:8000/docs

# 🛠️ Компоненты системы

**Сервис обработки аудио**  
- Распознавание речи с помощью `Whisper`.
- Определение спикеров (`Pyannote`) с использованием Hugging Face токена.
- Разметка временных меток.

**Сервис анализа и суммаризации**  
- Определение цели созвона.
- Выделение ключевых моментов.
- Генерация краткого резюме с помощью локальной `Llama3`.

**Frontend**  
- Реализован на **React**.
- Поддержка загрузки различных форматов аудио.


# ▶️ Установка и запуск

### Предварительные требования

Для работы необходимо получите токен Hugging Face для Pyannote:
  - Зарегистрируйтесь на [Hugging Face](https://huggingface.co/)
  - Перейдите в [Pyannote Speaker Diarization](https://huggingface.co/pyannote/speaker-diarization-3.1)
  - Создайте `токен` в настройках профиля

1. Переименуйте файл `.env.example` в `.env` и введите токен HF:
```
HF_TOKEN=your_huggingface_token_here
```

### Backend (FastAPI)

2. Создайте виртуальное окружение и установите зависимости:
```
python3.12 -m venv .venv
source .venv/bin/activate 
pip install -r requirements.txt
```

3. Запустите API:
```
python api/main.py
```

### Frontend (React)

4. Перейдите в папку frontend и установите зависимости:
```
cd frontend
npm install
```

5. Запустите веб-интерфейс:
```
npm start
```

Фронтенд доступен по адресу [http://localhost:3000](http://localhost:3000)

# 📦 Технологический стек

**Модели и библиотеки**
- `Whisper`  -автоматическая транскрибация речи.
- `Pyannote` - идентификация и сегментация спикеров.
- `Llama3` - суммаризация и выделение ключевых моментов.

**Backend**
- `FastAPI` - высокопроизводительное API.
- `Uvicorn` - сервер приложения.

**Frontend**
- `React` - современный UI-фреймворк.
- `Axios` - клиент для API-запросов.


# ✉️ Контакты

<div align="center">
  <img src="https://img.shields.io/badge/i.zolotykh@g.nsu.ru-E0FFFF?style=flat&logo=gmail&logoColor=red" height="28">
  <img src="https://img.shields.io/badge/@igor%5Fzolotykh-2CA5E0?logo=telegram&logoColor=white" height="28">
</div>