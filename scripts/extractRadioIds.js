/**
 * extractRadioIds.js
 *
 * Paste your Lofi Girl live stream URLs (and labels) below, then run:
 *   node scripts/extractRadioIds.js
 *
 * It will print a ready-to-paste `radioChannels.js` array with clean video IDs
 * extracted from each URL. Copy the output into your project.
 *
 * HOW TO GET THE URLS:
 * Go to youtube.com/@LofiGirl/streams, right-click each live thumbnail,
 * "Copy link address", and paste it below next to a label of your choice.
 */

// --- EDIT THIS LIST ---
const streams = [
  { id: 'lofi-study', label: 'Lofi Hip Hop', url: 'PASTE_URL_HERE' },
  { id: 'synthwave', label: 'Synthwave', url: 'PASTE_URL_HERE' },
  { id: 'sleep-ambient', label: 'Sleep Ambient', url: 'PASTE_URL_HERE' },
  { id: 'coffee-shop', label: 'Coffee Shop Jazz', url: 'PASTE_URL_HERE' },
  // add the rest of your streams here...
];
// --- STOP EDITING ---

function extractVideoId(url) {
  if (!url || url.includes('PASTE_URL_HERE')) return null;

  try {
    const parsed = new URL(url);

    // Standard watch URL: youtube.com/watch?v=XXXX
    if (parsed.searchParams.has('v')) {
      return parsed.searchParams.get('v');
    }

    // Short URL: youtu.be/XXXX
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '');
    }

    // Live URL: youtube.com/live/XXXX
    if (parsed.pathname.startsWith('/live/')) {
      return parsed.pathname.replace('/live/', '');
    }

    return null;
  } catch (err) {
    return null;
  }
}

const results = streams.map((stream) => {
  const videoId = extractVideoId(stream.url);
  return { ...stream, videoId };
});

const missing = results.filter((r) => !r.videoId);
if (missing.length > 0) {
  console.log(`⚠️  ${missing.length} stream(s) still need a real URL pasted in:`);
  missing.forEach((m) => console.log(`   - ${m.label}`));
  console.log('');
}

const configOutput = results
  .filter((r) => r.videoId)
  .map((r) => `  { id: '${r.id}', label: '${r.label}', videoId: '${r.videoId}' },`)
  .join('\n');

console.log('// --- Copy everything below into src/config/radioChannels.js ---\n');
console.log('export const RADIO_CHANNELS = [');
console.log(configOutput);
console.log('];');
