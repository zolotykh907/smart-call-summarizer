import logging
import os

from pyannote.audio import Pipeline
from pyannote.audio.pipelines.utils.hook import ProgressHook

from dotenv import load_dotenv
load_dotenv()


class SpeakerIdentifier:
    def __init__(self):
        self.hf_token = os.getenv("HF_TOKEN") # Requires Hugging Face token: set HF_TOKEN environment variable
        self.model_name = "pyannote/speaker-diarization-3.1"
        self.min_speakers = 1
        self.max_speakers = 5
        self.pipeline = None

        self._load_pipeline()

    def _load_pipeline(self):
        try:
            logging.info(f"Loading speaker diarization model ({self.model_name})")
            self.pipeline = Pipeline.from_pretrained(self.model_name,
                                                use_auth_token=self.hf_token)
        except Exception as e:
            logging.error(f"Failed to load model: {e}")
            raise

    def identify_speakers(self, audio_file):
        with ProgressHook() as hook:
            diarization = self.pipeline(audio_file, 
                                        hook=hook,
                                        min_speakers=self.min_speakers, 
                                        max_speakers=self.max_speakers)
        return diarization
    
    def get_segments_info(self, diarization):
        segments_info = []
        for segment, track, speaker in diarization.itertracks(yield_label=True):
            segments_info.append({'speaker': speaker,
                                  'start': segment.start,
                                  'end': segment.end})
            
        return segments_info


if __name__ == '__main__':
    #Usage example
    s = SpeakerIdentifier()

    res = s.identify_speakers('data/4.wav')
    print(s.get_segments_info(res))