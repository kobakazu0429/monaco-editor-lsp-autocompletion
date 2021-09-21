import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      vscode: require.resolve(
        "@codingame/monaco-languageclient/lib/vscode-compatibility"
      ),
    },
  },
});
