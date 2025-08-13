from typing import List, Optional
from abc import ABC, abstractmethod

from pydantic import BaseModel, Field
from langchain.output_parsers import PydanticOutputParser
from langchain.prompts import PromptTemplate
from langchain_ollama.llms import OllamaLLM
from langchain_openai import ChatOpenAI


class Action(BaseModel):
    title: str = Field(..., 
                       description='Название задачи')
    deadline: Optional[str] = Field(None, 
                                    description='Срок выполнения задачи, если указан. Если позволяет информация, в формате DD.MM')
    responsible: Optional[str] = Field(None, 
                                       description='Ответственный за задачу, если указан')
    details: Optional[str] = Field(None, 
                                   description='Детали задачи, подробности, если указаны')


class ExtractedActions(BaseModel):
    actions: List[Action] = Field(default_factory=list, 
                                   description='Извлеченные из созвона действия(задачи)')
    

class BaseActionExtractor(ABC):
    def __init__(self):
        self.parser = PydanticOutputParser(pydantic_object=ExtractedActions)
        self.template = """
        Ты интеллектуальный ассистент для извлечения действий и задач из текста созвона.

        Вот пример:
        Текст: 'Игорь должен сделать отчет о работе до 22.08'
        Ответ: 
        {{
            'actions': [
            {{'title': 'Сделать отчет',
                'deadline: '22.08',
                'responsible': 'Игорь'
            }}
            ]
        }}

        Извлеки задачи из созвона, вот его текст: 
        {text}

        Ответ выдавай строго в этом формате:
        {format_instructions}
        """

        self.prompt = PromptTemplate(
            template=self.template,
            input_variables=['text'],
            partial_variables={'format_instructions': self.parser.get_format_instructions()}
        )

    @abstractmethod
    def _invoke(self, prompt):
        pass

    def extract(self, text):
        try:
            prompt = self.prompt.format(text=text)
            output = self._invoke(prompt)
            return self.parser.parse(output)
        except Exception as e:
            raise ValueError(f"Validation error: {str(e)}")


class OllamaExtractor(BaseActionExtractor):
    def __init__(self, model_name='llama3'):
        super().__init__()
        self.model = OllamaLLM(model=model_name, 
                               temperature=0.2)
        

    def _invoke(self, prompt):
        return self.model.invoke(prompt)
    

class OpenAiExtractor(BaseActionExtractor):
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