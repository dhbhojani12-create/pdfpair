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

## 🖥 Desktop app for Windows (built 5 Nov 2026)

`desktop/` is an Electron app (main.js, preload.js, browser.html, bpreload.js). It loads the live site (GitHub Pages, so web updates reach it; the service worker gives offline) and adds a **built-in browser** window (🌐 Browser in ⋯ More, 🌐 Open ICAI site on the shelf). In that browser, PDFs are forced to download (Content-Disposition: attachment), saved to temp, then sent to the app (`window.ppDesktop.onFile`): ICAI shelf files are filed automatically, other PDFs show a card asking name / subject / type. Shelf **⤓ Get** and **⤓ Get all** download directly in the desktop app (`ppDesktop.fetchPdf`, no CORS limits). Its library is separate from Chrome's (Backup → Restore once).

- **Browser (desktop v1.1, 5 Nov):** tabs (＋ / Ctrl+T, × / Ctrl+W, middle-click; links that open a new window open a new tab), ← → ⟳, address, ☆ bookmark (where: ⭐ Bookmarks bar, a 📁 folder, or ＋ New folder), bar bookmarks (right-click to remove; Ctrl+click opens in a new tab), folder menu (Open all in tabs / Rename / Delete), 🔍 Google search (opens in a new tab). Bookmarks live in `userData/bookmarks.json` via IPC (`bm-get`/`bm-set`); the old file:// localStorage copy is migrated once. **The toolbar page loads from GitHub Pages (`desktop/browser.html`)**, so changes to it need no new zip; main.js falls back to the bundled copy when offline, on HTTP errors, or if the page lacks `#chrome`. The toolbar reports its height with `br.top()`. Menus hide the page views while open (`br.cover`) because WebContentsViews draw on top. Electron has no `prompt()`, so the `ask()` box is used instead. A new zip is only needed for main.js / preload changes. v1.2 (5 Nov): sign-in popups (Google/Apple/OAuth, or any `new-window` disposition) open as real popup windows so `window.opener` works; a page that closes itself removes its tab (the v1.1 crash "reading getTitle"); the browser session uses a plain Chrome user agent; uncaught errors in main are logged, not shown as dialogs. v1.3 (5 Nov): full screen. Page full screen (YouTube ⛶) makes the browser window full screen with the tab filling it; F11 toggles full screen in the browser (toolbar hidden) and in the main PDF Pair window; Esc leaves. v1.4 (5 Nov): only PDFs go into the library; any other download is saved to the Windows Downloads folder (numbered if the name exists) and shown in Explorer. PDFs live only inside the app's storage (IndexedDB), not in Downloads. v1.5 (5 Nov): ▣ Pop out (picture-in-picture, Alt+P), smooth switching: a playing video pops out by itself when you leave its tab (other tab, new tab, ◧ PDF Pair button, window blur/minimise) and returns when you come back to that tab/window (`pipAuto`/`pipBack`, `executeJavaScript(...,true)` for the user gesture). New generic IPC `br-run` (toolbar runs a script in the current tab), so future page features can ship with the toolbar page alone. v1.6 (5 Nov): video controls. The floating window gets ⏪/⏩ 10 s buttons (Media Session `seekbackward`/`seekforward`). While a video is popped out, PDF Pair's own window shows a 🎬 control bar (bottom right): ⟲10, play/pause, 10⟳, a position slider with time, speed 0.75–2×, ⤢ back to the tab; Alt+J / K / L (back 10 s, play/pause, forward 10 s; Alt+←/→ too). Compact, pinned to the bottom-right corner, raised above the toolbar when they would overlap. It polls the popped-out tab every second through `ppDesktop.video(js)` (IPC `pp-video`, runs in the `pipOwner` tab); `ppDesktop.showBrowser()` brings the browser forward, which returns the video. v1.7 (5 Nov): auto backup in the desktop app writes through Node (`ppDesktop.fs`: pick/dir/clear/write/read; folder saved in `userData/desktop.json`), wrapped as a fake directory handle (`deskDir`) so the backup code is unchanged; it never pauses after a restart. A folder from the old Chrome-style permission shows "Pick folder…" once. v1.8 (5 Nov; shipped inside v2.0; the zip is rebuilt from `desktop/` + `npm install` + seeds): 🛡 shield. Ads/trackers blocked with `@ghostery/adblocker-electron` (EasyList, EasyPrivacy, uBlock filters + privacy, all from raw.githubusercontent.com; engine cached in `userData/adblock-engine.bin`, refreshed daily). Known phishing/malware sites (curbengh phishing-filter + urlhaus-filter hosts, gh-pages branch) get `warn.html` (Go back / Continue anyway via `https://pdfpair.invalid/continue?u=`). Our own `onBeforeRequest`/`onHeadersReceived` wrap Ghostery's handlers (Electron allows one listener per event) and keep the PDF-download header. Toolbar 🛡 N = blocked on this page; menu: allow ads on this site (`desktop.json` `adAllow`) or turn off everywhere (`adOff`). Electron 33 lacks `registerPreloadScript`, polyfilled with `setPreloads`; cosmetic hiding of empty ad boxes is not verified (network blocking is). Packaging: copy `node_modules/{@ghostery,@remusao,tldts-experimental,tldts-core}` and `seed/` (adblock-engine.bin, badhosts.txt, generated by a first run) into `resources/app`. Test: `tests/desktop-shield.js`.
- The 📚 ICAI tab is hidden in the library (5 Nov, Darshan: not wanted); shelf matching still files ICAI downloads from the browser.
- **Package (no installer):** unzip the Electron win32-x64 release (v33.2.0 from GitHub), rename `electron.exe` to `PDF Pair.exe`, delete `resources/default_app.asar`, copy `desktop/*` into `resources/app/`, zip the folder. Not code-signed, so SmartScreen shows "More info → Run anyway" once. Only `desktop/` changes need a new zip.
- **Test:** `tests/desktop.js` (Linux Electron under `xvfb-run`; env `PP_URL` points at the local mock, `PP_TEST=1` uses the agent proxy and ignores its certificate).

## 🌐 Desktop browser v2.0 (5 Nov 2026)

Built while Darshan was away ("add them all one by one at your pace… make it look organised and colourful… send the file after all updates"). Includes the v1.8 🛡 shield.

**Layout (desktop/browser.html + desktop/tools.js, both load from GitHub Pages; bundled copies when offline):**
- Indigo→violet tab strip; messages and the 🧘 focus timer sit at its right end.
- Nav row: ← → ⟳ · address box (🛡 count, `Ctrl K`, ☆) · tool groups (📖 Reader, 🖍 Highlight, 📄 Save PDF) (▣ Pop out, 📌 Link, ⏩ Playback) (⇆ Split) · 🔍 Google · ▤ panel · ⧉ · ◧ PDF Pair. Labels hide below 1420 px and the Google box below 1250 px.
- Bookmarks bar. Right side panel (▤ or Ctrl+.) with 🗒 Notes, 🎓 Courses and ⏱ Focus; main keeps the page views clear of it (`br.inset({top,right})`).
- `ADV = br.kv && br.inset`: older desktop apps (≤1.7) get the simple bar.

**Features:**
- **📌 Lecture ↔ question (Alt+M):** the current video time (or the page) is added to the question open in PDF Pair: `st.links[n]` `{u,t,title,at}`. The index row shows "▶1 🗒1"; clicking it opens a popover with ▶ Play (opens the browser at that moment).
- **🗒 Notes:** per page (YouTube keyed by video id), with an optional ⏱ time; "→Q" adds the note to the open question (`st.wnotes[n]`). The list of all pages with notes is at the bottom.
- **🖍 Highlights (Alt+H):** stored per page, drawn with the CSS Custom Highlight API (no DOM changes), re-applied on load, and listed in Notes.
- **📖 Reader:** Mozilla Readability (Apache-2.0, `readability.js`) replaces the page with a clean article; A−/A+ and light/sepia/dark are remembered.
- **📄 Save PDF:** `printToPDF` → sent to PDF Pair like a download (the card asks name and subject).
- **⏩ Playback:** remembers the position (resume), speed per channel (`play.rates`), skip silence (Web Audio RMS, 2.5× during gaps, "saved" counter), sleep timer (minutes or end of video). Position is saved every 5 s in kv `pos`.
- **🎓 Courses:** kv `courses` `[{id,name,subject,items:[{u,title}]}]`; progress = max watched / duration.
- **⏱ Focus:** 25/50/90/custom minutes; distracting sites (editable list, path-aware, e.g. youtube.com/shorts) get `focus.html`. Stats come from kv `stats.days[YYYY-MM-DD][subject] {read,watch}` minutes: PDF Pair sends a minute each minute it is in front and was used in the last 2 minutes (`ppDesktop.track`); main adds a minute per minute of a playing video (subject from its course, else "Lectures"). Today bars + 7-day chart.
- **⌘ Command bar (Ctrl+K):** actions, open tabs, bookmarks, history (main `hist-get`), your questions (`__ppDesk.index()`), or go/search.
- **⇆ Split:** active tab left, another right; ratio 40/50/60/70, swap, close (`br-split`).
- Keys typed while a page has focus are forwarded to the bar (`br-key`): Ctrl+K/./T/W/L/Tab, Alt+H/M.

**Main additions:** kv store (`userData/kv/*.json`, `kv-get`/`kv-set`), history, `br-pdf`, `app-run` (runs JS in the PDF Pair window; used only with `window.__ppDesk`), `asset` (bundled readability/tools), focus blocking in `onBeforeRequest`, the stats timer, split layout, key forwarding. Browser-side data (notes, highlights, courses, stats) lives in the desktop app's data folder and is **not** in PDF Pair backups; links and notes added to questions are.

**Known:** the 🛡 blocker made YouTube show "You're offline" (5 Nov, Darshan's laptop; it blocks YouTube's own log/ads requests). Darshan allowed ads on youtube.com (he has Premium). Turning ads off for the site did not help, because Ghostery's page scripts (11 uBlock scriptlets on YouTube) still ran. v2.0.1: the cosmetic/scriptlet IPC handler is wrapped so it respects `siteOff` too, and youtube.com is unblocked by default (`adAllow` defaults to `['youtube.com']`).

**Tests:** `tests/desktop-v2-all.js` (Linux Electron + `xvfb-run`; needs the mock on :9300 and `tests/rangeserver.js` serving `tests/pages` plus a 120 s webm `v3.webm` on :9401). All 19 checks pass, as do the earlier desktop tests (tabs/bookmarks, pop-out, video bar, backup, shield, popups, full screen, other downloads).

## 📑 RTPs by subject page (5 Nov 2026)

`rtp.html` (served at https://dhbhojani12-create.github.io/pdfpair/rtp.html): ICAI Final RTPs from every attempt, grouped by paper (FR, AFM, Audit, DT, IDT, IBS) plus group-wise PDFs, with corrigenda under their paper. Rebuild with `python3 tools/rtp_page.py` when a new attempt is added to `YEARS`. All paper RTPs are also in `shelf.json`, so in the desktop browser a click files them as "RTP <attempt>" in the right subject (new subjects are created). `sw.js` skips same-origin pages other than the app itself, so opening rtp.html never replaces the cached app.

## 📚 ICAI shelf (built 5 Nov 2026)

Library → 📚 ICAI tab (per subject). Lists official ICAI PDFs from `shelf.json` in this repo (read from raw.githubusercontent.com, cached in `localStorage['shelf:data']`). Darshan chose **one set per chapter** (not whole modules). So far: **Audit** (Paper 3 study material Aug 2025 reprint, 20 chapter/unit files, + RTPs May 24 – Nov 26).

- **⤓ Get** opens the ICAI PDF (ICAI's CDN has no CORS, so the app cannot download it itself). The file is picked up by: a watched folder (`showDirectoryPicker`, handle in IDB `shelfDir`, scanned every 3 s), **⤓ Add downloaded files** (file picker starting in Downloads), or drag-drop onto the shelf. Matched by size (+ ICAI file name, "(1)" copies ok), added as a `same:true` set with `icai:<id>`, subject = the shelf paper key, type `mod`/`rtp`. No duplicates.
- "✨ marks ready" shows when an inbox package has the same `qSize`.
- **Adding a paper:** www.icai.org pages are readable with WebFetch (find them with WebSearch); `boslive.icai.org` and `resource.cdn.icai.org` work with curl (`tools/icai_scrape.py URL pattern` lists PDF links with the text before them). RTP lists: `boslive.icai.org/education_content_rtp_list.php?c=Final&content_year=November, 2026` etc. Get sizes with `curl -sI`, add to `shelf.json`, push (no app release needed). Study-material pages: Audit icai.org/post/sm-final-p3-may2026, FR icai.org/post/sm-final-p1-may2026.
- Test: `tests/shelf.js` (needs two ICAI PDFs in $SHDIR).

## ✨ Auto-mark: removed (4 Nov 2026)

Built on 4 Nov (ICAI finder + Gemini) and removed the same day at Darshan's request ("it is useless"). Don't bring it back unless he asks. The app now deletes the Gemini key it had saved (`gem:key`). The code is in git history (commits bb8fcae…b8e4d76) if ever needed.

Note: the module zips given on 1 Nov missed indented illustrations (about 150 across Modules 1–5) because the old parser required x < 90. Fixed in `marking/modules2to5_parse.py`.
