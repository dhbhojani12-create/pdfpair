# PDF Pair v2: build progress

New calm version, built beside the current app. Live at https://dhbhojani12-create.github.io/pdfpair/v2/
Design mockup (approved by Darshan, 11 Nov 2026): https://claude.ai/artifact/139ErPHRh8fX4ZzCajnbKv

## Safety rules
- v2 only READS the current app's data (`localStorage['pp:lib']`, IndexedDB `pdfpair/files` `blob:<id>`). It never writes there.
- v2 saves its own data under `localStorage['pp2:*']` (and later IndexedDB keys starting `v2:`).
- The current app (`index.html`, `src/PDF-Pair.html`) is not touched.
- Single file `v2/index.html`, libraries from `../lib/`. No build step yet.

## Stages
1. [done 11 Nov] Calm look, library by subject (reads current library), Normal PDF reader: smooth continuous pages, lazy rendering, Ctrl +/−, Ctrl 0 fit width, ←/→ pages, Esc back, remembers page and zoom per PDF (`pp2:pos:<fileId>`).
1b. [done 11 Nov] "Open a backup…" (bottom left): loads a PDF Pair backup zip into v2's own storage (IndexedDB `pdfpair2`, `localStorage['pp2:lib']`, old marks kept in `pdfpair2` key `projects` for later stages). Library uses the current app's `pp:lib` when this browser has one, else the backup copy.
2. [next] Tool pill (version A, bottom centre): V select, P pen, H highlighter (4 colours, 1–4), E eraser, L lasso, T text, N note; Ctrl Z / Ctrl Y. Marks saved per PDF file in `pp2:mk:<fileId>`.
3. Views switch (Ctrl 1/2/3): Normal / Question & answer / Concept book, remembered per PDF. Concept: "Add a point" panel (A), chapters, chapter notebook home.
4. Q&A view: two panes (same PDF shown twice when Q+A in one file; marks shared), stickers S, slim marking line (I important, D difficult, K tricky part, G got it, W wrong), [ ] prev/next, Tab answer. Import old stickers read-only.
5. Revise today (Space, 1/2/3), weak list, subject overview, "seen before" matching.
6. Lecture beside PDF (Alt V etc.), break screen + Quick fire, phone highlighter + phone revise, shortcuts list (?).

## Where I left off
(update this line every time work stops)
- 11 Nov 12:40: Stage 1 committed.
- 11 Nov 12:50: Darshan opened v2 in Edge and saw an empty library (his PDFs live elsewhere: Chrome or the desktop app, each has its own storage). Added "Open a backup…". Waiting for him: (a) which browser/app he uses, (b) OK to add a "Try the new version" item to the CURRENT app's ⋯ More menu so the desktop app can open v2 (not done, needs his OK), (c) his feedback on stage 1 with real PDFs. Then start stage 2.

## Testing
`cd repo && python3 -m http.server 8765 &` then a Playwright script that seeds `pp:lib` + IndexedDB `blob:f1` with a pdf-lib generated PDF (see /home/claude/v2test/t1.js pattern) and opens http://127.0.0.1:8765/v2/.
