import os
import sys
from moviepy.editor import VideoFileClip
import whisper
from transformers import pipeline

# ✅ Extract audio from video
def extract_audio(video_path, audio_path="temp_audio.wav"):
    try:
        clip = VideoFileClip(video_path)
        max_duration = min(clip.duration, 20)  # Limit to 20 seconds or full video length

        audio_clip = clip.audio.subclip(0, max_duration)
        audio_clip.write_audiofile(audio_path, codec='pcm_s16le', verbose=False, logger=None)  # ✅ No logs

        clip.close()
        audio_clip.close()
        
        return audio_path

    except Exception as e:
        sys.exit(1)

# ✅ Transcribe audio to text using Whisper
def transcribe_audio(audio_path):
    try:
        model = whisper.load_model("tiny")
        result = model.transcribe(audio_path)
        return result["text"]

    except Exception as e:
        sys.exit(1)

# ✅ Summarize transcribed text
def summarize_text(text):
    if len(text.split()) < 10:
        return "Transcript too short to summarize."

    try:
        summarizer = pipeline("summarization", model="facebook/bart-large-cnn", device=-1)  # CPU only
        summary = summarizer(text, max_length=40, min_length=10, do_sample=False)
        return summary[0]["summary_text"]

    except Exception as e:
        sys.exit(1)

# ✅ Main execution block
if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    video_file = sys.argv[1]

    try:
        audio_file = extract_audio(video_file)
        transcript = transcribe_audio(audio_file)
        summary = summarize_text(transcript)

        # ✅ Print only the clean summary
        print(summary)

        # ✅ Cleanup: Remove the temporary audio file
        if os.path.exists(audio_file):
            os.remove(audio_file)

    except Exception as e:
        sys.exit(1)
