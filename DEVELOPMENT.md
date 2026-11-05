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

## 📥 Claude inbox (built 5 Nov 2026)

How Claude delivers marks straight into the app, instead of restore files.

- **In the app:** ⋯ More → 📥 Claude inbox (phone: ⋯ → Claude inbox). "Turn on" makes a 16-letter code, kept in `prefs.ibCode` (so it travels in backups; restore adopts it if the device has none). The phone uses the same code (typed in, or from a backup).
- **Where:** `inbox/<first 20 hex of sha256("pdfpair-inbox:"+CODE)>.json` in this repo, read from `raw.githubusercontent.com` on open, every 5 minutes while visible, and on "Check now". Each item is `{id,at,salt,iv,ct}`: AES-GCM, key from PBKDF2-SHA256 (150k rounds) of the code. Wrong code = nothing found.
- **Package (inside):** `{setKey, qSize (size of the question PDF, used when the key does not match), setName, note, stickers{q,a}, names, meta}`, numbers from 1. The app shows a card "📥 New marks from Claude: <set> · N stickers", then Apply / Ignore. Apply opens that set, adds stickers after its highest number, skips any within 3% of an existing sticker on the same page, and one Ctrl+Z undoes it. Applied or ignored ids go in `prefs.ibDone`. If the set isn't on that device, Apply is disabled.
- **To send (Claude):** get the code from Darshan in chat (never commit it), build marks.json (set key from his backup .json), run `python3 tools/inbox_send.py CODE marks.json`, then commit and push `inbox/`. Items older than 45 days are pruned on each send. Test: `tests/ib.js`.

## ✨ Auto-mark: removed (4 Nov 2026)

Built on 4 Nov (ICAI finder + Gemini) and removed the same day at Darshan's request ("it is useless"). Don't bring it back unless he asks. The app now deletes the Gemini key it had saved (`gem:key`). The code is in git history (commits bb8fcae…b8e4d76) if ever needed.

Note: the module zips given on 1 Nov missed indented illustrations (about 150 across Modules 1–5) because the old parser required x < 90. Fixed in `marking/modules2to5_parse.py`.
