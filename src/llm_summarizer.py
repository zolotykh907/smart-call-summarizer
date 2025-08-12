import logging
from abc import ABC, abstractmethod
from langchain_ollama.llms import OllamaLLM
from langchain_openai import ChatOpenAI


class BaseSummarizer(ABC):
    def __init__(self):
        self.summary_prompt = """
        Ты интеллектуальный ассистент для анализа деловых созвонов.
        
        Проанализируй следующий текст созвона и создай резюме по следующему шаблону:
        - Основная цель созвона
        - Ключевые моменты
        - Действия и задачи

        Далее напиши краткое резюме (2-3 предложения).

        Оформь красиво в формате Markdown, на русском языке, соблюдая порядок заголовков:
        - Цель
        - Ключевые моменты
        - Действия и задачи
        - Резюме
        
        Текст созвона:
        {text}
        """

        self.simple_prompt = """
        Ты интеллектуальный ассистент для анализа деловых созвонов.

        Создай краткое резюме (2-3 предложения) следующего текста созвона:
        
        {text}
        """

    def _invoke(self, prompt):
        pass

    def full_summarize(self, text):
        try:
            if not text or len(text.strip()) < 10:
                return "Text is too short for analysis"
            result = self._invoke(self.summary_prompt.format(text=text))
            return result
        except Exception as e:
            logging.error(f"Error during summarization: {e}")
            return f"Error during processing: {e}"

    def summary_only(self, text):
        try:
            result = self._invoke(self.simple_prompt.format(text=text))
            return result
        except Exception as e:
            logging.error(f"Error during simple summarization: {e}")
            return f"Error: {e}"

    
class OllamaSummarizer(BaseSummarizer):
    def __init__(self, model_name='llama3'):
        super().__init__()
        self.model = OllamaLLM(model=model_name, temperature=0.2)

    def _invoke(self, prompt):
        return self.model.invoke(prompt)

class OpenAISummarizer(BaseSummarizer):
    def __init__(self, model_name="openai/gpt-oss-20b", 
                 base_url="http://localhost:1234/v1", 
                 api_key="lm-studio"
                 ):
        super().__init__()
        self.model = ChatOpenAI(
            model=model_name,
            base_url = base_url,
            api_key = api_key,
            temperature=0.2)

    def _invoke(self, prompt):
        return self.model.invoke(prompt).content