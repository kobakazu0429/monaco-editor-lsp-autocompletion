import { Message } from "vscode-jsonrpc/lib/common/messages.js";
import * as rpc from "vscode-ws-jsonrpc";
import * as server from "vscode-ws-jsonrpc/server";
import * as lsp from "vscode-languageserver";

export function launch(socket: rpc.IWebSocket) {
  const reader = new rpc.WebSocketMessageReader(socket);
  const writer = new rpc.WebSocketMessageWriter(socket);

  const socketConnection = server.createConnection(reader, writer, () =>
    socket.dispose()
  );

  const serverConnection = server.createServerProcess("c", "clangd");
  if (!serverConnection) {
    throw new Error("serverConnection is undefined.");
  }

  server.forward(socketConnection, serverConnection, (message) => {
    if (Message.isRequest(message)) {
      if (message.method === lsp.InitializeRequest.type.method) {
        const initializeParams = message.params as lsp.InitializeParams;
        initializeParams.processId = process.pid;
      }
    }
    return message;
  });
}
