from datetime import timedelta


def summary_to_markdown(text, filename):
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(text)

def dialogue_to_markdown(dialogue, filepath):
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