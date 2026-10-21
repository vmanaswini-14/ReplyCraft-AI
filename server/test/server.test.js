const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const PORT = 4317;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverProcess;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

before(async () => {
  serverProcess = spawn(
    process.execPath,
    [path.join(__dirname, "..", "server.js")],
    {
      cwd: path.join(__dirname, ".."),
      env: {
        ...process.env,
        PORT: String(PORT),
        GEMINI_API_KEY: "test-key-for-automated-tests",
      },
      stdio: "ignore",
    }
  );

  serverProcess.on("error", (error) => {
    console.error("Could not start test server:", error);
  });

  for (let attempt = 0; attempt < 50; attempt++) {
    if (serverProcess.exitCode !== null) {
      throw new Error("Test server exited before becoming ready.");
    }

    try {
      const response = await fetch(`${BASE_URL}/`);

      if (response.ok) {
        return;
      }
    } catch {
      // The server may still be starting.
    }

    await sleep(100);
  }

  throw new Error("Test server did not start within 5 seconds.");
});

after(() => {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill();
  }
});

test("GET / returns a successful server response", async () => {
  const response = await fetch(`${BASE_URL}/`);
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.match(data.message, /ReplyCraft AI/i);
});

test("Empty email returns HTTP 400", async () => {
  const response = await fetch(`${BASE_URL}/generate-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "",
      tone: "Professional",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.ok(data.error);
});

test("Missing email returns HTTP 400", async () => {
  const response = await fetch(`${BASE_URL}/generate-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tone: "Professional",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.ok(data.error);
});

test("Email exceeding 20,000 characters returns HTTP 400", async () => {
  const response = await fetch(`${BASE_URL}/generate-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "A".repeat(20001),
      tone: "Professional",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 400);
  assert.ok(data.error);
});