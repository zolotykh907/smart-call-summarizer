import os
import logging
from langchain_ollama.llms import OllamaLLM
from speech_recognition import SpeechRecognizer

from dotenv import load_dotenv

class LlmSummarizer:
    def __init__(self, model_name='llama3'):
        """
        Initialize the summarizer with Ollama
        
        Args:
            model_name: Name of the model in Ollama (default: 'llama3')
        """
        try:
            self.model = OllamaLLM(model=model_name)
            logging.info(f"Model {model_name} successfully loaded")
        except Exception as e:
            logging.error(f"Error loading model: {e}")
            raise

        self.prompt = """
        Ты интеллектуальный ассистент для анализа деловых созвонов.
        
        Проанализируй следующий текст созвона и создай резюме по следующему шаблону:
        - Основная цель созвона
        - Ключевые моменты
        - Действия и задачи

        Далее напиши краткое резюме (2-3 предложения).

        Оформь красиво в формате Markdown, на русском языке.
        
        Текст созвона:
        {text}
        """

    def full_summarize(self, text):
        """
        Summarize the call transcript
        
        Args:
            text: Text to summarize
            
        Returns:
            Structured summary
        """
        try:
            if not text or len(text.strip()) < 10:
                return "Text is too short for analysis"
            
            result = self.model.invoke(self.prompt.format(text=text))
            return result
        except Exception as e:
            logging.error(f"Error during summarization: {e}")
            return f"Error during processing: {e}"

    def summary_only(self, text):
        """
        Extract only the summary
        
        Args:
            text: Text to analyze
            
        Returns:
            Summary
        """
        prompt = """
        Создай краткое резюме (2-3 предложения) следующего текста созвона:
        
        {text}
        """
        
        try:
            result = self.model.invoke(prompt.format(text=text))
            return result
        except Exception as e:
            logging.error(f"Error during summary creation: {e}")
            return f"Error: {e}"


if __name__ == "__main__":
   # Usage example
    summarizer = LlmSummarizer()
    speech_recognizer = SpeechRecognizer()

    audio_file = 'data/temp_audio.wav'
    text = speech_recognizer.speech_to_text(audio_file)
    print(text)
    
    summary = summarizer.full_summarize(text)
    print(summary)