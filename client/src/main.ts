import * as monaco from "monaco-editor";
import { listen } from "@codingame/monaco-jsonrpc";
import {
  MonacoLanguageClient,
  MessageConnection,
  CloseAction,
  ErrorAction,
  MonacoServices,
  createConnection,
} from "@codingame/monaco-languageclient";
import normalizeUrl from "normalize-url";
import ReconnectingWebSocket from "reconnecting-websocket";
import type { Options as ReconnectingWebSocketOptions } from "reconnecting-websocket";

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
const url = createUrl("/sampleServer");
const webSocket = createWebSocket(url);
// listen when the web socket is opened
listen({
  webSocket: webSocket as any,
  onConnection: (connection) => {
    // create and start the language client
    const languageClient = createLanguageClient(connection);
    const disposable = languageClient.start();
    connection.onClose(() => disposable.dispose());
  },
});

function createLanguageClient(
  connection: MessageConnection
): MonacoLanguageClient {
  return new MonacoLanguageClient({
    name: "Sample Language Client",
    clientOptions: {
      // use a language id as a document selector
      documentSelector: ["c"],
      // disable the default error handler
      errorHandler: {
        error: () => ErrorAction.Continue,
        closed: () => CloseAction.DoNotRestart,
      },
    },
    // create a language client connection from the JSON RPC connection on demand
    connectionProvider: {
      get: (errorHandler, closeHandler) => {
        return Promise.resolve(
          createConnection(connection, errorHandler, closeHandler)
        );
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
