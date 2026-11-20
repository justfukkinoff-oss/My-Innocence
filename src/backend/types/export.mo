// DOCX export of a draft.

import Common "../types/common";

module {
  // A generated DOCX document: the file bytes plus the filename to save it
  // under. The document carries the caption block, numbered paragraphs,
  // headings, the not-legal-advice disclaimer and a source appendix.
  public type ExportedDocument = {
    filename : Text;
    bytes : Blob;
  };

  // The caption block and disclaimer the exporter stamps onto the document.
  public type ExportOptions = {
    caption : Text;
    disclaimer : Text;
  };
};
