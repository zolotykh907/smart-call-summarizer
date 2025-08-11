import os
import logging

from utils import dialogue_to_markdown
from llm_summarizer import LlmSummarizer
from speaker_identifier import SpeakerIdentifier
from speech_recognition import SpeechRecognizer


class SummaryPipeline:
    def __init__(self):
        self.summarizer = LlmSummarizer()
        self.speaker_identifier = SpeakerIdentifier()
        self.speech_recognizer = SpeechRecognizer()

    def _merge_speaker_segments(self, segments, eps=0.5):
        if len(segments)==0:
            return []
        
        merged_segments = []

        for i in range(0, len(segments)-1):
            cur_speaker = segments[i]['speaker']
            merged_text = segments[i]['text']
            start, end = segments[i]['start'], segments[i]['end']

            for j in range(i+1, len(segments)):
                next_speaker = segments[j]['speaker']

                if next_speaker == cur_speaker:
                    merged_text += segments[j]['text']
                    end = segments[j]['end']
                else:
                    break

            merged_segments.append({
                'speaker': cur_speaker,
                'text': merged_text,
                'start': start,
                'end': end
            })

        return merged_segments     
    
    def _merge_diarization_and_recognition(self, diarization_segments, recognition_segments, eps=0.1):
        diarization_segments = sorted(diarization_segments, key=lambda x: x['start'])
        recognition_segments = sorted(recognition_segments, key=lambda x: x['start'])

        merged_segments = []
        for segment in recognition_segments:
            recognition_start, recognition_end = segment['start'], segment['end']
            text = segment['text']

            for diarization_segment in diarization_segments:
                diarization_start, diarization_end = diarization_segment['start'], diarization_segment['end']
                speaker = diarization_segment['speaker']

                if (recognition_end >= diarization_start - eps) and (recognition_start <= diarization_end + eps):
                    merged_segments.append({'speaker': speaker, 
                                'text': text,
                                'start': max(recognition_start, diarization_start),
                                'end': min(recognition_end, diarization_end)})
                    break
        return merged_segments

    def run(self, audio_file):
        diarization = self.speaker_identifier.identify_speakers(audio_file)
        segments_info = self.speaker_identifier.get_segments_info(diarization)
        
        recognition_result = self.speech_recognizer.speech_to_text(audio_file)

        summary = self.summarizer.full_summarize(recognition_result['text'])
        dialogue_segments = self._merge_diarization_and_recognition(segments_info, recognition_result['segments'])
        dialogue_segments = self._merge_speaker_segments(dialogue_segments)

        return {'summary':summary, 
                'dialogue':dialogue_segments}


if __name__ == "__main__":
    pipeline = SummaryPipeline()
    res = pipeline.run('data/5.wav')

    #pipeline.summary_to_markdown(res['summary'])
    dialogue_to_markdown(res['dialogue'], filepath='data/5.md')
    # print(res['summary'])
    # print('\n')
    # print('-'*40)
    # print('\n')
    # for d in res['dialogue']:
    #     print(d)