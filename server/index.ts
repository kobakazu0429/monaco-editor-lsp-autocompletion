import path from "node:path";
import url from "node:url";
import type http from "node:http";
import type net from "node:net";
import { WebSocketServer } from "ws";
import express from "express";
import { type IWebSocket } from "vscode-ws-jsonrpc";
import { launch } from "./clangd-server-launcher.js";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
globalThis.__dirname == __dirname;

process.on("uncaughtException", function (err: any) {
  console.error("Uncaught Exception: ", err.toString());
  if (err.stack) {
    console.error(err.stack);
  }
});

// create the express application
const app = express();
// server the static content, i.e. index.html
app.use(express.static(__dirname));
// start the server
const server = app.listen(3001);
// create the web socket
const wss = new WebSocketServer({
  noServer: true,
  perMessageDeflate: false,
});
server.on(
  "upgrade",
  (request: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    const pathname = request.url ? url.parse(request.url).pathname : undefined;
    if (pathname === "/lsp") {
      wss.handleUpgrade(request, socket, head, (webSocket) => {
        const socket: IWebSocket = {
          send: (content) =>
            webSocket.send(content, (error) => {
              if (error) {
                throw error;
              }
            }),
          onMessage: (cb) => webSocket.on("message", cb),
          onError: (cb) => webSocket.on("error", cb),
          onClose: (cb) => webSocket.on("close", cb),
          dispose: () => webSocket.close(),
        };
        // launch the server when the web socket is opened
        if (webSocket.readyState === webSocket.OPEN) {
          launch(socket);
        } else {
          webSocket.on("open", () => launch(socket));
        }
      });
    }
  }
);
