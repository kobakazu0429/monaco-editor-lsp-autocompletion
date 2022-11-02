import * as monaco from "monaco-editor";
import {
  MonacoLanguageClient,
  CloseAction,
  ErrorAction,
  MonacoServices,
  MessageTransports,
} from "monaco-languageclient";
import {
  toSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from "vscode-ws-jsonrpc";
import normalizeUrl from "normalize-url";
import ReconnectingWebSocket, {
  type Options as ReconnectingWebSocketOptions,
} from "reconnecting-websocket";

const app = document.querySelector<HTMLDivElement>("#app")!;

// register Monaco languages
monaco.languages.register({
  id: "c",
  extensions: [".c"],
});

// create Monaco editor
const value = `#include <stdio.h>

int main() {

    return 0;
}`;

const editor = monaco.editor.create(app, {
  model: monaco.editor.createModel(
    value,
    "c",
    monaco.Uri.parse("file:///main.c")
  ),
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

// install Monaco language client services
MonacoServices.install(monaco as any);

// create the web socket
const url = createUrl("/lsp");
const webSocket = createWebSocket(url);
webSocket.onopen = async () => {
  const socket = toSocket(webSocket as any);
  const reader = new WebSocketMessageReader(socket);
  const writer = new WebSocketMessageWriter(socket);
  const languageClient = createLanguageClient({
    reader,
    writer,
  });
  await languageClient.start();
  reader.onClose(async () => await languageClient.stop());
};

function createLanguageClient(
  transports: MessageTransports
): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: "Sample Language Client",
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ["c"],
      // disable the default error handler
      errorHandler: {
        error: () => ({ action: ErrorAction.Continue }),
        closed: () => ({ action: CloseAction.DoNotRestart }),
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: () => {
        return Promise.resolve(transports);
      },
    },
  });
}

function createUrl(path: string): string {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  return normalizeUrl(
    `${protocol}://localhost:3001/${location.pathname}${path}`
  );
}

function createWebSocket(url: string) {
  const socketOptions: ReconnectingWebSocketOptions = {
    maxReconnectionDelay: 10000,
    minReconnectionDelay: 1000,
    reconnectionDelayGrowFactor: 1.3,
    connectionTimeout: 10000,
    maxRetries: Infinity,
    debug: false,
  };
  return new ReconnectingWebSocket(url, [], socketOptions);
}
