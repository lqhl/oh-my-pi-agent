#!/usr/bin/env node

// undici's EnvHttpProxyAgent reads HTTP_PROXY / HTTPS_PROXY / NO_PROXY automatically
// and implements the dispatcher interface for native fetch.
import { EnvHttpProxyAgent } from 'undici';
import { YoutubeTranscript } from 'youtube-transcript-plus';

// All three fetch hooks must be proxied: videoFetch, playerFetch, transcriptFetch.
// If any hook is missing the library falls back to its internal defaultFetch
// which bypasses the proxy.
function makeProxyFetch() {
  const agent = new EnvHttpProxyAgent();
  return (params) => {
    const { url, ...options } = params;
    return fetch(url, { ...options, dispatcher: agent });
  };
}

const videoId = process.argv[2];

if (!videoId) {
  console.error('Usage: transcript.js <video-id-or-url>');
  console.error('Example: transcript.js EBw7gsDPAYQ');
  console.error('Example: transcript.js https://www.youtube.com/watch?v=EBw7gsDPAYQ');
  process.exit(1);
}

// Extract video ID if full URL is provided
let extractedId = videoId;
if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
  const match = videoId.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) {
    extractedId = match[1];
  }
}

const proxyFetch = makeProxyFetch();

try {
  const transcript = await YoutubeTranscript.fetchTranscript(extractedId, {
    videoFetch: proxyFetch,
    playerFetch: proxyFetch,
    transcriptFetch: proxyFetch,
  });

  for (const entry of transcript) {
    const timestamp = formatTimestamp(entry.offset / 1000);
    console.log(`[${timestamp}] ${entry.text}`);
  }
} catch (error) {
  console.error('Error fetching transcript:', error.message);
  process.exit(1);
}

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}
