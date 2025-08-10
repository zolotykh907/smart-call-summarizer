import logging

import whisper
from pydub import AudioSegment


class SpeechRecognizer:
    def __init__(self, model_size='small', language='ru', cache_enabled=True):
        self.model_size = model_size
        self.language = language
        self.model = None
        self._load_model()


    def _load_model(self):
        try:
            logging.info(f"Loading Whisper model ({self.model_size})")
            self.model = whisper.load_model(self.model_size)
        except Exception as e:
            logging.error(f"Failed to load model: {e}")
            raise

    def _preprocess_audio(self, audio_file):
        try:
            audio = AudioSegment.from_file(audio_file)
            audio = audio.set_frame_rate(16000).set_channels(1)
            temp_path = "data/temp_audio.wav"
            audio.export(temp_path, format="wav")
            return temp_path
        except Exception as e:
            logging.error(f"Audio preprocessing failed: {e}")
            raise

    def recognition(self, audio_file, language=None):
        lang = language or self.language
        processed_audio_file = self._preprocess_audio(audio_file)
        try:
            result = self.model.transcribe(processed_audio_file, language=lang)
            return result
        except Exception as e:
            logging.error(f"Recognition failed: {e}")
            raise

    def speech_to_text(self, audio_file):
        segments = []
        keys = ['id', 'start', 'end', 'text']

        recognition_result = self.recognition(audio_file)

        for segment in recognition_result['segments']:
            segments.append({key: segment[key] for key in keys})

        return {'text': recognition_result['text'],
                'segments': segments
        }
        


if __name__ == "__main__":
    # Usage example
    s = SpeechRecognizer()
    print(s.recognition('data/4.wav')['segments'])