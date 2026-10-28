# HSE Plan Maker

Project Health, Safety & Environment Plan generator for Oxypro Electromechanical Work LLC projects. You fill in the project data (or import it from the Oxypro Project Library, a PQP Maker project or the Projects Master List), and export the HSE Plan as an editable Word file or a PDF. The standard text is the company sample *Project HSE Plan* (Rev 00, 26.06.2024), laid out in the same format as the Project Quality Plan made by PQP Maker.

Developed by Mark Lontoc | Dubai, United Arab Emirates | © 2026 MLWorks. All rights reserved.

## For developers

```
npm install
npm run build      # dist/web (installable web app) and dist/release/HSE Plan Maker.html + README.txt (single file)
npm run pages      # build, then copy dist/web to docs/ for GitHub Pages
npm run samples    # sample Word + PDF from the test data into samples/
npm test           # rule checks (numbering, table of contents, imports, Word and PDF output)
node tests/e2e.cjs <dir>         # Playwright smoke test of the single-file build
node tests/e2e-import.cjs <dir>  # import, plans list and shared-link flows
```

- `src/content/hse.ts` is the standard text (sections 1–9, terms, warnings, appendices) with project tokens.
- `src/content/build.ts` turns a plan and the standard text into one document model (cover, Document Control page, table of contents, body).
- `src/gen/docx.ts` writes the Word file (R1 styles, section numbering, PAGEREF fields in the table of contents); `src/gen/pdf.ts` writes the PDF with pdfmake in two passes (the second prints the page ranges).
- `src/importers.ts` reads Library / PQP Maker files and links and the Projects Master List workbook; `src/share.ts` makes the email draft and the share link.
- `src/app.tsx` is the interface; `src/ui/plans.tsx` the My HSE Plans list; `src/ui/review.tsx` the Review page; `src/ui/about.tsx` the About panel.

## Copyright

© 2026 MLWorks. All rights reserved. The HSE Plan text, Oxypro logo and the signed policy statements are Oxypro company material.
