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
- **Per-set marks:** `localStorage['pp:'+set.key]`. It holds `stickers{q,a}`, `hl{q,a}`, `stars{q,a}`, `bm{q,a}`, `bmn` (bookmark names), `names`, `meta{n:{ch,tp,amd}}`, `topics` (concept markers; `side:'a'` when on the answer side), `clips` (Last-day cards), `rev`, `crev`, `mcq` (answer key), `mans` (MCQ answers), `mocks`, `notes` (📝 page notes) and `imgs` (📸 pictures placed on pages).
  - `key` = `name|size::name|size`.
- **PDFs:** IndexedDB `pdfpair` / `files`, stored as `blob:<id>`.
- **Quiz text:** stored as `quiz:<setKey>`.
- **Search text:** IndexedDB `txt:<fileId>` = `{v:1,pages:[text per page],ocr:{pageNo:{t,b:[[offset,len,x0,y0,x1,y1]]}}}` (OCR boxes in page-width units). Pictures: IndexedDB `img:<id>` (placed) and `cap:<id>` (tray); tray list in `localStorage['cap:tray']`.
- **Preferences:** `localStorage['pp:prefs']`.
- **Backup zip:** `pdfpair.json` (`{app:'PDF Pair',version:1,projects,…,blobs:[ids],imgs:[ids]}`) plus `blobs/<id>.pdf` and `imgs/<id>.png|jpg` (placed pictures).
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
- **🕘 History** (panel tab, Ctrl+H; also in Ctrl+K): grouped by day, search, open (Ctrl+click: new tab), Clear history. Main records every page visit (`hist-get`, last 3000). Ctrl+H typed while a *page* has focus is forwarded by main.js v2.0.2+.
- **⌘ Command bar (Ctrl+K):** actions, open tabs, bookmarks, history (main `hist-get`), your questions (`__ppDesk.index()`), or go/search.
- **⇆ Split:** active tab left, another right; ratio 40/50/60/70, swap, close (`br-split`).
- Keys typed while a page has focus are forwarded to the bar (`br-key`): Ctrl+K/./T/W/L/Tab, Alt+H/M.

**Main additions:** kv store (`userData/kv/*.json`, `kv-get`/`kv-set`), history, `br-pdf`, `app-run` (runs JS in the PDF Pair window; used only with `window.__ppDesk`), `asset` (bundled readability/tools), focus blocking in `onBeforeRequest`, the stats timer, split layout, key forwarding. Browser-side data (notes, highlights, courses, stats) lives in the desktop app's data folder and is **not** in PDF Pair backups; links and notes added to questions are.

**Known:** the 🛡 blocker made YouTube show "You're offline" (5 Nov, Darshan's laptop; it blocks YouTube's own log/ads requests). Darshan allowed ads on youtube.com (he has Premium). Turning ads off for the site did not help, because Ghostery's page scripts (11 uBlock scriptlets on YouTube) still ran. v2.0.2 (5 Nov): the browser opens on Google instead of icai.org; Ctrl+H forwarded. v2.0.1: the cosmetic/scriptlet IPC handler is wrapped so it respects `siteOff` too, and youtube.com is unblocked by default (`adAllow` defaults to `['youtube.com']`).

**Tests:** `tests/desktop-v2-all.js` (Linux Electron + `xvfb-run`; needs the mock on :9300 and `tests/rangeserver.js` serving `tests/pages` plus a 120 s webm `v3.webm` on :9401). All 19 checks pass, as do the earlier desktop tests (tabs/bookmarks, pop-out, video bar, backup, shield, popups, full screen, other downloads).

## 📄 PDF features (5 Nov 2026, web + desktop v2.1.0)

Darshan asked for: search inside PDFs + OCR, everyday PDF tools (add/delete pages, split, combine…), capture from video/web onto a page, and notes on pages ("for note also include the text size adjustment").

- **📝 Notes (N):** Note tool in the bottom bar. Click a page to type; click a note to edit, drag to move, corner to resize (width), eraser or 🗑 deletes. Bar while editing: 🟨 sticky / T plain, black/blue/red text, A− size A+ (8–40 pt at A4 width; stored as `sz`, drawn as `sz/595` page widths so it scales with zoom). `st.notes=[{id,side,page,x,y,w,txt,sty:'s'|'p',c:'k'|'b'|'r',sz}]`. Empty notes vanish. Save PDF draws them with Helvetica (₹ becomes "Rs.", unsupported characters become "?"). Classes are `.nte/.ntx/.nta/.nbar` (`.nb`/`.cb` were taken).
- **🔎 Search (Ctrl+F, or ⋯ More → Search PDFs):** bar at the top: This PDF / Library, ↑ ↓ (Enter / Shift+Enter / F3), results list with snippets grouped by side or set. Text comes from pdf.js once per file and is cached in IndexedDB `txt:<id>`. Matches are highlighted on the page (`.fhit` in the page div, boxes from text items). Notes are searched too (📝). Library search opens the set and jumps to the match.
- **🔍 OCR:** when pages have no text, the bar offers "Read with OCR". Tesseract.js 5.1.1 from cdn.jsdelivr.net (worker, core `tesseract.js-core@5.1.1`, English `@tesseract.js-data/eng@1.0.0/4.0.0_best_int`), runs on the device, page by page with Stop. Results (with word boxes) are stored in `txt:<id>.ocr`.
- **🧰 PDF tools (⋯ More → PDF tools):** one window, tabs: 📄 Organise & combine (thumbnails; click/shift-click select; drag to reorder; ⟲ ⟳ 🗑 per page or selected; ＋ Add PDF / From library / Blank page; ⤓ Extract = only selected), ✂ Split (every N / ranges / by PDF bookmarks / every page → ZIP or one set per part), 🖼 Images → PDF (A4 with margin or image size; EXIF-correct via createImageBitmap), 📤 PDF → images (PNG/JPG, 100/150/220 dpi, ZIP), #️⃣ Page numbers (position, style, start, skip first N). Ways out: ⤓ Download and 📚 Save to library never touch the original. **♻ Replace in this set** (Organise and Page numbers, only for a PDF of the open set): marks move with their pages (stickers, highlights, stars, bookmarks + names, clips, notes, topic markers, pictures), rotated pages turn their marks (`rotMark`), marks on deleted pages are counted and listed in a warning first, and the original PDF + marks are kept as a new set "<name> (original <date>)" with key `orig:<id>`. Aborts if storage is full. Thumbnails (7 Nov, a 467-page DT book showed only "…"): rendered newest-request-first and only while the card is on screen (passed cards are re-observed), cached as JPEG data URLs per page (`PT.tc`) so the grid redraw on every click shows them instantly. Test: `tests/pdftools-thumbs.js`. Opening PDF tools (7 Nov) opens the PDF of the page you are reading and scrolls to that page, selected softly (the first click on another page replaces it), so ＋ Blank page goes right after it (`ptHere`). The tool buttons row is sticky at the top of the grid. Unsaved changes (7 Nov, Darshan added a blank page and closed, expecting it in the PDF): the footer shows "⚠ Not in your PDF yet: press ♻ Replace in this set", and closing (✕, Esc, outside click) asks first (`ptChanged`, `PT.savedSig` set by Download / Save to library). Test: `tests/pdftools-here.js`.
- **📸 Captures:** desktop browser 📸 Capture button / Alt+S (forwarded from pages by main v2.1.0): main `br-cap` → `capturePage()`; the toolbar shows the frozen picture, you drag a box (Enter = whole page, Esc = cancel), the crop goes `br-cap-send` → main → PDF Pair (`ppDesktop.onCapture`, IPC `pp-cap`). In PDF Pair it lands in the 📸 tray (bottom left; also ⋯ More → Captures, ＋ Picture, or paste a screenshot with Ctrl+V on the web too) and is armed: the next click on a page places it at its on-screen size. Pictures: drag, corner resize (keeps shape), ✕ or eraser, Ctrl+Z. `st.imgs=[{id,src,side,page,x,y,w,ar}]`; in Save PDF and in "Backup with PDFs" (not the JSON auto backup).
- **Tests:** `tests/notes.js`, `tests/search-ocr.js` (needs `tesseract.js@5.1.1` and `@tesseract.js-data/eng@1.0.0` installed next to the test), `tests/pdftools.js`, `tests/desktop-capture.js` (Electron; the test box had no CDN access, so it injects pdf.js/pdf-lib/JSZip from :9401/lib). All pass. Pre-existing failures not caused by this work: `clt.js` "next clip remembers the last chapter/topic", `lkm.js` timeout.

## 🎬 Phone remote for laptop lectures (5 Nov 2026, web only)

Darshan: control the laptop's video from the linked phone, but "while annotation i do not want any obstacle". So nothing is added on the PDF: the phone's side pill (`#dock`) gets a `#dkVid` button (between ↶ and ‹ ›) that shows only while a video plays in the desktop browser. Tapping it slides `#vidPop` out beside the pill (⟲10 ⏯ 10⟳ speed-cycle ⌃); a tap on the page tucks it back. ⌃ opens `#vidSheet` (slider, 🔊 volume slider + mute, speed chips, 📌 Link to the laptop's open question, 📸 Capture this frame → laptop tray, 🗒 Note, Close).
- Laptop (desktop app, linked as laptop): every 1.5 s reads the video via `ppDesktop.video(VJS2)` (PiP video, else the playing/longest `<video>` in the current tab) and PUTs `rooms/<room>/vid` `{p,t,d,r,title,q}` only when something changes, it drifts > 2.5 s, or every 15 s; null when no video.
- Phone streams `rooms/<room>/vid`, extrapolates the time locally, and POSTs `cmd {op:'vid',a:'toggle'|'seek'|'to'|'rate'|'vol'|'mute'|'link'|'cap'|'note',v}`; the laptop's `laptopCmd` → `vRemoteCmd`. Frame capture draws the `<video>` to a canvas (works for YouTube/MSE; otherwise a toast points to Alt+S).
- Works with the desktop app from v2.0 (uses the existing `ppDesktop.video`), no new zip. Class names are prefixed (`vsh`, `vbig`, `vsp`…) because generic ones (`.sh`, `.big`) were taken.
- Test: `tests/desktop-phoneremote.js` (Electron laptop + Pixel 7 phone on the mock); all 18 checks pass.

## ⤓ Save PDF: choose what goes on it (5 Nov 2026)

Darshan could not get a PDF without stickers. The Save PDF dialog now has "Put on the PDF:" Stickers & links / Highlights / Notes & pictures / Stars, plus "Clean PDF (nothing)". Remembered in `prefs.expInc`. With nothing ticked the file is named "(clean)" and has no marks, links or pair bookmarks. Test: `tests/save-clean.js`.

**Locked (encrypted) PDFs:** ICAI study-material PDFs are AES-256 encrypted with an empty open-password. pdf-lib cannot read them ("Expected instance of PDFDict, but got undefined"), so Save PDF failed on them (5 Nov). `plLoad(bytes,key)` tries pdf-lib, and on an "encrypted" error fetches `@cantoo/pdf-lib@2.11.1` from jsdelivr once (evaluated as a CommonJS module so it does not replace `window.PDFLib`), decrypts, saves a plain copy (cached per file in memory) and loads that. Used by Save PDF and all PDF tools. Test: `tests/save-locked.js` with `F=<ICAI ch14u1.pdf>`.

## 📱 YouTube mini window (desktop v2.2.0, 5 Nov 2026)

📱 Mini in the browser toolbar or **Alt+P** (Alt+P used to toggle picture-in-picture; ▣ Pop out still does that). The video's tab (its WebContentsView, same `persist:browser` session, so Google/YouTube Premium sign-in) is moved out of the browser window into `miniWin`: frameless, always on top, bottom-right, snaps to screen edges, with `mini.html` as a 34 px purple bar (⟲10 ⏯ 10⟳ speed 📌 📸 ⌄/⌃ ⇲ ⤢ ✕). Main polls the video every 700 ms: playing → video-only (CSS class `ppminiv` makes `.html5-video-player`/`video` fill the viewport; window resized to the video's aspect, bottom-right corner kept), paused or ⌄ → phone-size full page (width 300/340/420 by ⇲, height ×1.87). A new play ends a manual ⌄. Stability (v2.2.1): your own width is kept (`miniW`, set on `resized`), the video-only window keeps the video shape while you drag (`setAspectRatio` with the bar as extra height), mode switches wait 1.5 s after any move/resize and need two equal readings, height is capped to the screen. The video is chosen only on YouTube watch/live/shorts pages (results and home play muted hover previews, which made the window jump between sizes, seen in Darshan's recording) and elsewhere only a video at least half the window wide; same rule in the web `VSEL` for the phone remote. Test: `tests/desktop-mini-steady.js`. ⤢ returns the view to its tab (keeps playing), ✕ returns it paused; closing the tab closes the mini. `pp-video` (🎬 bar, phone remote) prefers the mini tab. 📌 calls `__ppDesk.link` in the main window; 📸 `capturePage` of the video rect → `pp-cap`. Test: `tests/desktop-mini.js` (16 checks pass); v2-all and pip tests still pass.

**v2.3.0 video only (5 Nov, Darshan: "just the video, nothing else"; mockup approved; hide YouTube extras):** on a lecture page the mini window shows only the video, playing or paused (no bar: the view fills the window, window has the video's aspect). `MINI_OV` injects into the page a style (everything `visibility:hidden` except the player box `.ppmvbox` and our layer) and `#ppmov`: hover-fade top strip (title, 📌 📸 ⇲ ⤢ ✕; drag to move) and bottom controls (progress click-to-seek, ⟲10 ⏯ 10⟳ speed 🔊, time), big ▶ when paused, click toggles play, wheel = volume. The layer talks to main with `console.log('ppmini:<cmd>')` (`console-message`); dragging is done by main following the cursor (`ppmini:drag` … `ppmini:dragend`) because app-region does not work inside a WebContentsView. Pages without a lecture (YouTube home/search) open in YouTube's phone layout (`m.youtube.com` with an Android user agent) under a slim bar (title, ←, ⇲, ⤢, ✕); leaving the mini window restores the desktop agent and www URL (keeping the time). Burned-in "Subscribe" logos inside the video itself cannot be removed.

**▶ Lectures (same day):** red ▶ Lectures button in PDF Pair's bottom bar (desktop only, `ppDesktop.openMini` present) and Alt+Y: search YouTube (Enter → results page), Continue watching (kv `pos` entries `yt:<id>` not finished, newest 4, opened with `&t=`), Linked to this question (`st.links[activeN]`), My courses (next unfinished item from kv `courses`), Open YouTube. Main `mini-open` opens the URL straight in the mini window, creating the browser window hidden if needed (`openBrowser(url,true)`); if a mini window is open it navigates its tab. `lec-list` returns {recent,courses}. Test: `tests/desktop-lectures.js`.

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

**8 Nov 2026:** Darshan asked for the old ▣ Pop out player back. The v2.3.1 zip (Alt+P = plain picture-in-picture, auto pop-out on leaving the tab, 🎬 bar in PDF Pair; no mini window) was packaged from `desktop/` and sent. desktop-pip and desktop-videobar tests pass.

**📌 Link fixes (8 Nov):** the 🎬 video bar has a 📌 button (VJS now returns the tab URL). `__ppDesk.link` (bar 📌, browser 📌 Link / Alt+M) links to the picked question as before; when no question is picked, or in a concept book, it now links to the page you are reading instead of failing: `st.pglinks['q:12']=[{u,t,title,at}]`, shown as a red ▶ 12:30 chip at the top right of that page (click plays in the ▶ Lecture player for YouTube, ✕ removes). Test: `tests/desktop-linkbar.js`.

## ☁ PoolDrive (12 Nov 2026)

PoolDrive (`dhbhojani12-create/PoolDrive`, https://dhbhojani12-create.github.io/PoolDrive/) pools several Google Drive accounts into one. It runs on the same origin as PDF Pair, so PDF Pair reads its sign-ins from `localStorage['pooldrive.accounts.v1']` (`{email,token,exp,limit,usage}`) and its OAuth client id from `localStorage['pooldrive.cfg.v1'].clientId`. Everything is hidden when those are missing (other browsers, the desktop app until PoolDrive is set up there, the claude.ai artifact). Sign-ins are Google access tokens (1 hour); an expired account shows "Reconnect" buttons (one tap each, GIS token client loaded on demand), and the new token is written back so PoolDrive gets it too.

- **Add a set → ☁ From PoolDrive** (`.pdslot`, under each slot): picker `#pdp` browses all accounts merged by folder name (PDFs and folders only), search across accounts, second tap or "Use this PDF" downloads it and hands it to the slot (`slotTake[side]`), so the set is stored in IndexedDB exactly like a chosen file.
- **Backup → PoolDrive backup** (`.pdb` in the backup popup): marks JSON (the same `snapshot()` as auto backup, plus `pdBlobs`) uploaded to `PDF App Backup/PDF Pair backups/PDF Pair backup <stamp>.json` every 3 hours while open (also when the tab is hidden after an hour), only when a sign-in is valid; keeps the newest 5 (older go to Drive Trash). Same "far fewer questions" guard: saved as `(check)` and nothing is pruned. Option **PDFs too**: each library PDF is uploaded once to `…/PDFs/<name> (<blobId>).pdf`; uploaded ids in `localStorage['pdb:up']`. Settings in `localStorage['pdb:cfg']` `{on,pdfs,last:{at,n}}`. The folder goes to the account that already has it (if it has room), else the one with the most free space.
- **Restore…** lists the 10 newest backups from all accounts; picking one downloads it plus any PDFs missing on this device (found by `(<blobId>).pdf`) and opens the normal restore confirmation (merge, safety copy first).
- Code: the `PD` block just before "backup: auto". Classes are prefixed `pd*` (`.ph`, `.pi` etc. were taken).

**Backup moved to the Library (12 Nov 2026, Darshan: "take backup/restore out of the PDF screen, to the top level"):** the bottom-bar `#bBk` button is hidden and no longer goes into ⋯ More or the phone menu (the element stays for old code paths; clicking it opens the Library panel). The Library sidebar's old "⟲ Restore a backup" is now **☁ Backup & restore** (`#libRestore`, with the status dot `#bkDot2`) and opens the same backup popup beside it (`openBk(anchor)`, `bkAnchor`; centered at the bottom when there is no room, e.g. on the phone). "Restore a backup" in Add a set and the Android share-target restore open it there too.

**App-wide things live in the Library (12 Nov 2026, same request):** 📥 Claude inbox (`#libInbox`), 📱 Link phone (`#libPhone`, mirrors `#bLinkT` and turns blue when linked; laptop only) and 🌐 Browser (desktop app, `#bBrowse` is now a Library button) moved out of ⋯ More; `#bInbox`/`#bLink` stay hidden in the bar for their status code. The ⋯ dot still shows when the phone is linked. 🔎 Search PDFs stays in ⋯ More (and Ctrl+F) and is also in the Library (`#libSearch`, opens the search bar in Library scope). The phone's own ⋯ menu lost Claude inbox (it is in its Library); its "Link to laptop" stays.

**Compact Library tools (12 Nov 2026, Darshan: the six full-width buttons squeezed the sets list):** only "+ Add a set" stays full width; Search / Backup / Inbox / Phone (/ Browser on desktop) are small icon tiles in one row (`.libtools` > `.lt`). Phone tile reads Phone / Linked / Away and turns blue when linked; the backup dot sits on the Backup tile.

**Back up with PDFs: progress (12 Nov 2026, Darshan: "not working" in the desktop app, nothing visible):** the popup now closes and the toast shows "Collecting your PDFs… i of n", then "Packing n PDFs (X MB)… %" (JSZip STORE + streamFiles), then "Saving…". A packing failure (e.g. memory on a very large library) shows a clear message instead of failing silently. **Parts (12 Nov, same day):** in the desktop app a small library backed up fine (tested), so the likely failure is size: the whole library was packed into one in-memory zip. Now PDFs are grouped into parts of about 300 MB (`window.__bkPartMB` overrides for tests); each part is a complete backup (all marks + its PDFs, `snap.part={n,of}`), saved one after another as "PDF Pair full backup <date> part k of n.zip". Restoring every part (any order) brings back every PDF. Tests: `tests/desktop-fullbackup.js` (Electron, 1 zip and forced parts), `tests/backup-parts-restore.js` (web restore of the parts).

**PoolDrive backup progress (12 Nov 2026, Darshan: "show me the process"):** while it runs the PoolDrive box shows "Uploading PDFs… N%", "i of n: <name>", a progress bar, "X MB of Y MB · k already in PoolDrive", then "Saving your marks…" (moving bar). The Library ☁ tile shows the percent. PDFs upload with XHR (`PD.uploadP`) for byte progress; the account/folder is reused across PDFs while it has room (was looked up per PDF). `PD.prog`, redraws throttled by `pdPaint()`.
