import os
import logging
from datetime import timedelta

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
                    merged_segments.append({'speaker': speaker, 
                                'text': text,
                                'start': max(recognition_start, diarization_start),
                                'end': min(recognition_end, diarization_end)})

        return merged_segments


    def summary_to_markdown(self, text, filename='data/4_summary.md'):
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(text)


    def dialogue_to_markdown(self, dialogue, filepath="data/4_dialogue.md"):
        def format_time(seconds):
            td = timedelta(seconds=seconds)
            minutes, seconds = divmod(td.seconds, 60)
            return f"{minutes:02}:{seconds:02}"

        lines = ["Текст созвона\n"]
        for seg in dialogue:
            speaker = seg["speaker"]
            start = format_time(seg["start"])
            end = format_time(seg["end"])
            text = seg["text"].strip()
            lines.append(f"**{speaker}** [{start} – {end}]: {text}  ")

        with open(filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))



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

    pipeline.summary_to_markdown(res['summary'])
    pipeline.dialogue_to_markdown(res['dialogue'])
    # print(res['summary'])
    # print('\n')
    # print('-'*40)
    # print('\n')
    # for d in res['dialogue']:
    #     print(d)