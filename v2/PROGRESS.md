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
2. [next] Tool pill (version A, bottom centre): V select, P pen, H highlighter (4 colours, 1–4), E eraser, L lasso, T text, N note; Ctrl Z / Ctrl Y. Marks saved per PDF file in `pp2:mk:<fileId>`.
3. Views switch (Ctrl 1/2/3): Normal / Question & answer / Concept book, remembered per PDF. Concept: "Add a point" panel (A), chapters, chapter notebook home.
4. Q&A view: two panes (same PDF shown twice when Q+A in one file; marks shared), stickers S, slim marking line (I important, D difficult, K tricky part, G got it, W wrong), [ ] prev/next, Tab answer. Import old stickers read-only.
5. Revise today (Space, 1/2/3), weak list, subject overview, "seen before" matching.
6. Lecture beside PDF (Alt V etc.), break screen + Quick fire, phone highlighter + phone revise, shortcuts list (?).

## Where I left off
(update this line every time work stops)
- 11 Nov 12:40: Stage 1 committed. Next: start stage 2 (tool pill + highlighter).

## Testing
`cd repo && python3 -m http.server 8765 &` then a Playwright script that seeds `pp:lib` + IndexedDB `blob:f1` with a pdf-lib generated PDF (see /home/claude/v2test/t1.js pattern) and opens http://127.0.0.1:8765/v2/.
