const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const frontendDir = path.resolve(__dirname, "..");
const rootDir = path.resolve(frontendDir, "..");
const backendRepo = path.join(rootDir, "mukham_fastAPI");
const backendDir = path.join(backendRepo, "fastapi_backend");

const pythonCandidates = [
  path.join(backendRepo, ".venv", "bin", "python"),
  path.join(backendRepo, ".venv", "Scripts", "python.exe"),
  path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", "Python310", "python.exe"),
  "python",
  "py",
];

const python = pythonCandidates.find((candidate) => {
  return candidate === "python" || candidate === "py" || fs.existsSync(candidate);
});

const nextBin = process.platform === "win32"
  ? path.join(frontendDir, "node_modules", ".bin", "next.cmd")
  : path.join(frontendDir, "node_modules", ".bin", "next");

const children = [];

function start(name, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    shell: false,
  });

  children.push(child);

  child.on("error", (error) => {
    console.error(`[${name}] ${error.message}`);
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  return child;
}

function stopAll() {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
}

process.on("SIGINT", () => {
  stopAll();
  process.exit();
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit();
});

start("backend", python, ["-m", "uvicorn", "app.main:app", "--reload", "--port", "8002"], backendDir);
start("frontend", nextBin, ["dev"], frontendDir);
