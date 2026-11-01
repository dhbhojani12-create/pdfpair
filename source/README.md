# PaperPair source

- `v2.html` – the app template (single file, all code). Edit this.
- `build.py` – fills in the sample data, writes `paperpair.html` and the detector test copies. Run from this folder.
- `PaperPair.html` – the latest built single-file app (same as the published artifact).
- `reg2.sh`, `dumpjson.mjs` – regression run for the Find detector over a set of sample PDFs (PDFs are not in this repo).
- `tests/e2e/` – Playwright end-to-end tests. They expect sample PDFs in `/tmp/e2e/pdfs/` (not included).

The web page in the repo root (`index.html`) is an older published build and is not changed by this folder.
