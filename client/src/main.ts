import * as monaco from "monaco-editor";
// import {
//   createConnection,
//   MonacoLanguageClient,
//   MonacoServices,
//   Services,
// } from "monaco-languageclient";
// import { createMessageConnection } from "vscode-jsonrpc";
// import { AbstractMessageReader } from "vscode-jsonrpc/lib/messageReader.js";
// import { AbstractMessageWriter } from "vscode-jsonrpc/lib/messageWriter.js";

const app = document.querySelector<HTMLDivElement>("#app")!;

const editor = monaco.editor.create(app, {
  language: "c",
  theme: "vs-dark",
  scrollbar: {
    arrowSize: 11,
  },
  fontSize: 16,
  wordWrap: "on",
  minimap: {
    enabled: false,
  },
  lineNumbers: "on",
});
editor.updateOptions({ tabSize: 2 });
