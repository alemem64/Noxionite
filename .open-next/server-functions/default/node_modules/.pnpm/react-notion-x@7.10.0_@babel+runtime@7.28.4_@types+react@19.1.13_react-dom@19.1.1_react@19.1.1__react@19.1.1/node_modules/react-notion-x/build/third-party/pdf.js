// src/third-party/pdf.tsx
import React from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { jsx } from "react/jsx-runtime";
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
function Pdf({ file, ...rest }) {
  const [numPages, setNumPages] = React.useState(0);
  function onDocumentLoadSuccess({ numPages: numPages2 }) {
    setNumPages(numPages2);
  }
  return /* @__PURE__ */ jsx(Document, { file, onLoadSuccess: onDocumentLoadSuccess, ...rest, children: Array.from(Array.from({ length: numPages }), (_, index) => /* @__PURE__ */ jsx(Page, { pageNumber: index + 1 }, `page_${index + 1}`)) });
}
export {
  Pdf
};
//# sourceMappingURL=pdf.js.map