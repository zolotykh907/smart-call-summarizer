import os
import logging

from utils import dialogue_to_markdown, summary_to_markdown
from llm_summarizer import OllamaSummarizer, OpenAISummarizer
from actions_extractor import OllamaExtractor, OpenAiExtractor
from speaker_identifier import SpeakerIdentifier
from speech_recognition import SpeechRecognizer


class SummaryPipeline:
    def __init__(self):
        self.summarizer = OpenAISummarizer()
        self.actions_extractor = OpenAiExtractor()
        self.speaker_identifier = SpeakerIdentifier()
        self.speech_recognizer = SpeechRecognizer()
        self.current_stage = None

    def _merge_speaker_segments(self, segments, eps=0.5):
        merged_segments = []
        i = 0
        while i < len(segments):
            cur_speaker = segments[i]['speaker']
            merged_text = segments[i]['text']
            start, end = segments[i]['start'], segments[i]['end']

            j = i + 1
            while j < len(segments) and segments[j]['speaker'] == cur_speaker:
                merged_text += segments[j]['text']
                end = segments[j]['end']
                j += 1

            merged_segments.append({
                'speaker': cur_speaker,
                'text': merged_text,
                'start': start,
                'end': end
            })

            i = j 

        return merged_segments 
    
    def _merge_diarization_and_recognition(self, diarization_segments, recognition_segments, eps=0.1):
        diarization_segments = sorted(diarization_segments, key=lambda x: x['start'])
        recognition_segments = sorted(recognition_segments, key=lambda x: x['start'])

        merged_segments = []
        for recognition_segment in recognition_segments:
            recognition_start, recognition_end = recognition_segment['start'], recognition_segment['end']
            text = recognition_segment['text']

            overlaps = []
            for diarization_segment in diarization_segments:
                diarization_start, diarization_end = diarization_segment['start'], diarization_segment['end']
                speaker = diarization_segment['speaker']

                start = max(recognition_start, diarization_start)
                end = min(recognition_end, diarization_end)
                overlap = end - start
                
                if overlap > 0:
                    overlaps.append((speaker, overlap))

            if len(overlaps) != 0:
                speaker = max(overlaps, key=lambda x: x[1])[0]
                merged_segments.append({
                    'speaker': speaker,
                    'text': text,
                    'start': recognition_start,
                    'end': recognition_end})
        return merged_segments

    def run(self, audio_file, progress_cb=None, *, flag_summary=True, flag_dialogue=True, flag_actions=True):
        summary = None
        dialogue_segments = None
        actions = None

        try:
            self.current_stage = 'speech_recognition'
            if progress_cb: progress_cb(step='speech_recognition', progress=10, message='Распознаём речь...')
            recognition_result = self.speech_recognizer.speech_to_text(audio_file)

            if flag_dialogue:
                self.current_stage = 'speaker_identification'
                if progress_cb: progress_cb(step='speaker_identification', progress=40, message='Определяем спикеров...')
                diarization = self.speaker_identifier.identify_speakers(audio_file)
                segments_info = self.speaker_identifier.get_segments_info(diarization)

                self.current_stage = 'merge'
                if progress_cb: progress_cb(step='merge', progress=60, message='Сопоставляем реплики и спикеров...')
                dialogue_segments = self._merge_diarization_and_recognition(segments_info, recognition_result['segments'])
                dialogue_segments = self._merge_speaker_segments(dialogue_segments)

            if flag_summary:
                self.current_stage = 'summarization'
                if progress_cb: progress_cb(step='summarization', progress=80, message='Генерируем резюме...')
                summary = self.summarizer.full_summarize(recognition_result['text'])

            if flag_actions:
                if progress_cb: progress_cb(step='actions', progress=90, message='Извлекаем задачи...')
                actions_obj = self.actions_extractor.extract(recognition_result['text'])
                actions = [a.dict() for a in getattr(actions_obj, 'actions', [])]

            self.current_stage = 'done'
            if progress_cb: progress_cb(step='done', progress=100, message='Готово')
            
            result = {}
            if flag_summary:
                result['summary'] = summary
            if flag_dialogue:
                result['dialogue'] = dialogue_segments
            if flag_actions:
                result['actions'] = actions
            return result
        except Exception as e:
            self.current_stage = 'failed'
            if progress_cb:
                progress_cb(step='failed', message=str(e))
            raise


if __name__ == "__main__":
    #Usage example
    pipeline = SummaryPipeline()
    res = pipeline.run('data/6.wav')

    print(res['actions'].dict())

    #summary_to_markdown(res['summary'], filepath='data/4s.md')
    # print(res['summary'])
    # print('\n')
    # print('-'*40)
    # print('\n')
    # for d in res['dialogue']:
    #     print(d)
