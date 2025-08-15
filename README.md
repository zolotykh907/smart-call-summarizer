<h1 align="center">Smart Call Summarizer</h1>

<div align="center" style="margin: 20px 0;">
  <img src="https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white&logoWidth=40" alt="Python" height="30">
  <img src="https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&logoWidth=40" alt="Docker" height="30">
  <img src="https://img.shields.io/badge/Llama3-FF6600?logo=meta&logoColor=white&logoWidth=40" alt="Llama3" height="30">
  <img src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&logoWidth=40" alt="FastAPI" height="30">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white&logoWidth=40" alt="React" height="30">
  <img src="https://img.shields.io/badge/Whisper-000000?logo=openai&logoColor=white&logoWidth=40" alt="Whisper" height="30">
  <img src="https://img.shields.io/badge/Pyannote-FF6F61?logo=python&logoColor=white&logoWidth=40" alt="Pyannote" height="30">
  <img src="https://img.shields.io/badge/OpenAI GPT-412991?logo=openai&logoColor=white&logoWidth=40" alt="OpenAI GPT" height="30">
  <img src="https://img.shields.io/badge/LM_Studio-00B388?logo=windows-terminal&logoColor=white&logoWidth=40" alt="LM Studio" height="30">
</div>

Интеллектуальный сервис для анализа и суммаризации созвонов с современным веб-интерфейсом.  


Система:
* Принимает аудиофайл созвона.
* Выполняет автоматическую транскрибацию речи (`Whisper`).
* Определяет участников разговора и разделяет их реплики (`Pyannote`).
* Выделяет ключевые моменты и цель созвона.
* Генерирует краткое резюме с помощью `LLM` и предоставляет полный текст с временными метками.
* Использует `React` - удобный веб-интерфейс для взаимодействия.

!["video"](images/web_demo.gif)

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
- Определение спикеров (`Pyannote`).
- Разметка временных меток.

**Сервис анализа и суммаризации**  
С помощью `LLM` выполняется:
- Определение цели созвона.
- Выделение ключевых моментов.
- Извлечение действий и задач.
- Генерация краткого резюме.

**Frontend**  
- Реализован на **React**.
- Поддержка загрузки различных форматов аудио.


# 🧠 Модели и конфигурация

Поддерживаются два варианта провайдеров языковых моделей (LLM) для суммаризации и извлечения задач:

- Ollama: тестировалось на `llama3`.
- LM Studio: тестировалось на `gpt-oss-20b`.

Выбор провайдера задаётся в коде в `src/summary_pipeline.py`.
Замените используемые классы суммаризатора и экстрактора действий.

Примеры настройки в коде:

```python
#LM Studio
from llm_summarizer import OpenAISummarizer
from actions_extractor import OpenAiExtractor

self.summarizer = OpenAISummarizer(
    model_name="openai/gpt-oss-20b",           # имя модели в LM Studio
    base_url="http://localhost:1234/v1",       # адрес локального сервера LM Studio
    api_key="lm-studio"                        # любое значение
)
self.actions_extractor = OpenAiExtractor(
    model_name="openai/gpt-oss-20b",
    base_url="http://localhost:1234/v1",
    api_key="lm-studio"
)

#Ollama
from llm_summarizer import OllamaSummarizer
from actions_extractor import OllamaExtractor

self.summarizer = OllamaSummarizer(model_name="llama3")
self.actions_extractor = OllamaExtractor(model_name="llama3")
```


# ▶️ Установка и запуск

### Предварительные требования

🦙 **Пример работы с llama3 (Ollama):**

Для работы с `llama3` нужно [установить Ollama](https://ollama.com/download).

Далее нужно скачать llama3:
```
ollama pull llama3
```
В терминале запустите сервер Ollama, и не закрывайте его:
```
ollama serve
```

**Пример работы с `gpt-oss-20b` (LM Studio):**

- Скачайте модель в приложении

- Перейдите во вкладку *develop*

- Загрузите модель

- Запустите сервер

Далее в `src/summary_pipeline.py` выберите желаемого провайдера и модели (см. примеры выше в разделе “Модели и конфигурация”).

Так же необходимо получить токен Hugging Face для Pyannote:
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
- `Llama3` / `gpt-oss-20b` - суммаризация и выделение ключевых моментов.

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