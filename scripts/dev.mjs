import { spawn } from "node:child_process";

delete process.env.NODE_OPTIONS;
delete process.env.VSCODE_INSPECTOR_OPTIONS;

const child = spawn("next", ["dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
