---
name: youtube-transcript
description: Fetch the transcript and title of a YouTube video as JSON. Use when the user provides a YouTube URL and you need the spoken content (captions) for analysis, summarization, quoting, or search.
---

# YouTube Transcript

Fetches a YouTube video's title and full transcript by pulling captions via `yt-dlp`. Prefers manual English subtitles, falls back to auto-generated English.

## Requirements

- `yt-dlp` on PATH (`brew install yt-dlp`)
- Python 3
- `node` on PATH — yt-dlp needs a JS runtime to solve YouTube's JS challenges; without it extraction fails with `The page needs to be reloaded.`

## Cookies

The script automatically uses `~/yt-cookies.txt` (Netscape format) if it exists. YouTube frequently returns `Sign in to confirm you're not a bot` to datacenter IPs; a logged-in cookie file clears that up.

To create the file, run this on a machine with a browser logged into YouTube:

```bash
yt-dlp --cookies-from-browser chromium --cookies ~/yt-cookies.txt \
  --skip-download --list-subs "<any_youtube_url>"
```

Swap `chromium` for `firefox`, `edge`, etc. as needed. A browser extension that exports cookies in Netscape format works too. The file is a login credential — never print, paste, or commit its contents.

## Usage

```bash
python3 ~/.pi/agent/skills/youtube-transcript/fetch_transcript.py "<youtube_url>"
```

## Output

Prints a JSON object to stdout:

```json
{
  "title": "Video title",
  "transcript": "full transcript text as a single string"
}
```

Progress/info logs go to stderr. On failure (no English captions, network error, bad URL), the script exits non-zero with a message on stderr.

## Notes

- Only English captions are attempted (`en`, `en-US`, `en-GB`, then any `en*`). Manual captions are preferred over auto-generated.
- Many videos have no manual captions but do have auto-generated ones; those usually appear as `en-orig` (original language ASR) plus auto-translated tracks.
- Transcript is plain text with timing/formatting stripped — not timestamped.
- For non-English videos or videos with captions disabled, the script will fail; consider `video_extract` with a Gemini prompt as a fallback.
