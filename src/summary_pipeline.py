import os
import logging

from llm_summarizer import LlmSummarizer
from speaker_identifier import SpeakerIdentifier
from speech_recognition import SpeechRecognizer


class SummaryPipeline:
    def __init__(self):
        self.summarizer = LlmSummarizer()
        self.speaker_identifier = SpeakerIdentifier()
        self.speech_recognizer = SpeechRecognizer()


    def merge_diarization_and_text(self, diarization_segments, recognition_segments, eps=0.1):
        merged_segments = []
        for segment in recognition_segments:
            recognition_start, recognition_end = segment['start'], segment['end']
            text = segment['text']

            for diarization_segment in diarization_segments:
                diarization_start, diarization_end = diarization_segment['start'], diarization_segment['end']
                speaker = diarization_segment['speaker']

                if (diarization_start > recognition_start - eps) and (diarization_end < recognition_end + eps):
                    merged_segments.append({'s': speaker, 
                                'text': text,
                                'start': max(recognition_start, diarization_start),
                                'end': max(recognition_end, diarization_end)})

        return merged_segments


    def save_to_markdown(self, text, filename='data/4.markdown'):
        with open(filename, "w", encoding="utf-8") as f:
            f.write("# Итог созвона\n\n")
            sections = [s.strip() for s in text.split("**") if s.strip()]
            
            for section in sections:
                if ":" in section:
                    title, content = section.split(":", 1)
                    f.write(f"## {title.strip()}\n\n")
                    f.write(f"{content.strip()}\n\n")
                else:
                    f.write(f"{section}\n\n")


    def run(self, audio_file):
        diarization = self.speaker_identifier.identify_speakers(audio_file)
        segments_info = self.speaker_identifier.get_segments_info(diarization)
        
        recognition_result = self.speech_recognizer.speech_to_text(audio_file)

        summary = self.summarizer.full_summarize(recognition_result['text'])
        dialogue_segments = self.merge_diarization_and_text(segments_info, recognition_result['segments'])

        return {'summary':summary, 
                'dialogue':dialogue_segments}
        



if __name__ == "__main__":
    pipeline = SummaryPipeline()
    res = pipeline.run('data/4.wav')

    pipeline.save_to_markdown(res['summary'])
    # print(res['summary'])
    # print('\n')
    # print('-'*40)
    # print('\n')
    # for d in res['dialogue']:
    #     print(d)