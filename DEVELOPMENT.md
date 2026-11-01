# PDF Pair: handoff for a new session

PDF Pair is a CA Final study app built by Darshan (GitHub: dhbhojani12-create). It links question PDFs and answer PDFs with numbered stickers. It also does highlighting, stars, concept books, revision, MCQ practice and mock tests. A phone can be linked to the laptop as a touch highlighter.

- **Live app (phone + laptop):** https://dhbhojani12-create.github.io/pdfpair/ (installable PWA)
- **Also published as a Claude artifact:** https://claude.ai/artifact/AFDDw8f8DxyFd4iDykbHXW

## Files

| Path | What |
|---|---|
| `src/PDF-Pair.html` | **The source.** One self-contained HTML file: CSS, markup and all JS. Edit this. |
| `tools/build.py` | Builds `index.html` from the source: swaps CDN libraries for the copies in `lib/`, keeps the PWA head and tail, stamps `APPV` (the version label shown in the app) and bumps the service-worker cache name. Run `python3 tools/build.py`, then commit and push; GitHub Pages serves it. |
| `index.html`, `sw.js`, `manifest.webmanifest`, `lib/`, `icons/` | The built PWA. `sw.js` loads pages network-first and caches everything else, and accepts Android "Share → PDF Pair" files (POST /share). |
| `tests/*.js` | Playwright checks (Node; `require('playwright')`). `fbmock.js` is a fake Firebase on 127.0.0.1:9300 that also serves `/app.html` from the source. Start it with `node tests/fbmock.js &` and launch Chromium with `--no-proxy-server`. Most tests restore a demo library zip (`/home/claude/demo/demo.zip`, built from the user's backup and PDFs, which are **not** in the repo); recreate one from the user's own files when needed. |
| `marking/*.py` | PyMuPDF scripts used to auto-mark ICAI PDFs: RTP, Past Papers, MTP, the MCQ case-scenario booklet, and Study Material Modules 1–5 (Illustration→Solution, Test Your Knowledge and Practice Questions, tagged with the user's chapter names). |

User PDFs and backups are never committed.

## Data model (browser storage)

- **Library:** `localStorage['pp:lib']` = `{subjects, sets:[{id,name,subject,type,key,files:{q:[{id,name,size}],a:[…]},same}]}`.
  - Set types are `mod`, `mtp`, `rtp`, `pyq`, `mcq`, `oth` and `con` (concept book).
- **Per-set marks:** `localStorage['pp:'+set.key]`. It holds `stickers{q,a}`, `hl{q,a}`, `stars{q,a}`, `bm{q,a}`, `bmn` (bookmark names), `names`, `meta{n:{ch,tp,amd}}`, `topics` (concept markers; `side:'a'` when on the answer side), `clips` (Last-day cards), `rev`, `crev`, `mcq` (answer key), `mans` (MCQ answers) and `mocks`.
  - `key` = `name|size::name|size`.
- **PDFs:** IndexedDB `pdfpair` / `files`, stored as `blob:<id>`.
- **Quiz text:** stored as `quiz:<setKey>`.
- **Preferences:** `localStorage['pp:prefs']`.
- **Backup zip:** `pdfpair.json` (`{app:'PDF Pair',version:1,projects,…,blobs:[ids]}`) plus `blobs/<id>.pdf`.
  - Restore **merges**: sets with the same key are replaced, and all other sets stay.
  - **Always give the user "safe" restore files.** These contain only the new set's project and blob, with no `lib` entry, so nothing else in their library can be harmed.

## Phone ↔ laptop link

- Firebase Realtime Database through plain REST and EventSource (no SDK), at `https://pdfpair-default-rtdb.asia-southeast1.firebasedatabase.app/`.
- **Paths:**
  - `rooms/{room}/follow`: the laptop's page and question.
  - `rooms/{room}/hl`: highlights from the phone (a queue).
  - `rooms/{room}/cmd`: steps, side changes, MCQ taps and the WebRTC answer.
  - `rooms/{room}/rtc`: the WebRTC offer for "Send to phone over Wi-Fi".
  - `rooms/{room}/phone`: a heartbeat.
  - `codes/{6-digit}`: pairing codes.

## Working with the user (important)

- The user is a CA Final student and not a programmer. Keep replies plain and short.
- **Show a mockup before building any new UI**, and wait for "yes".
- Keep the phone minimal: it is mainly a highlighter.
- Don't add chapter or topic tags unless asked.
- The user's chapter names include, for example, "Ind AS 116 Leases", "Ind AS 109 Financial Instruments", "Ind AS 8 Policy, Estimate and Error" and "Accounting and Tech". Reuse them exactly. Ask for their latest backup .json to read the full list.
- Test only what changed, unless they ask for a full check. Then publish and tell them the new version label (`APPV`).
- The user said "I don't want any problem further": prefer optional changes, and never risk their data.

## Next feature (planned, not built): ✨ Auto-mark

Agreed with Darshan on 1 Nov 2026. Show him a mockup first.

1. **Built-in auto-mark for ICAI PDFs (no AI):** port `marking/*.py` to JS inside the app, using pdf.js text with positions. It should handle these patterns:
   - "Illustration N" → "Solution".
   - "Questions" / "Answers" sections: Test Your Knowledge and Practice Questions.
   - RTP and past-paper Q/A numbering.
   - Tag each sticker with the user's own chapter names.
2. **Optional Gemini for other formats** (coaching notes, scanned books):
   - The user pastes a free Google AI Studio API key, stored only on the device.
   - Send page text with line positions to Gemini (or page images for scanned PDFs), in batches, respecting free-tier limits.
   - Ask for JSON: question start, answer start and chapter.
3. **Review screen before stickers are placed:** a list plus a preview. The user ticks or fixes each item, then applies.
4. **Tell the user** that on Google's free tier, the data sent can be used to improve Google's products.
