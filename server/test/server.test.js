const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

// Enable test mode before loading the server.
process.env.NODE_ENV = "test";

const app = require("../server.js");

let server;
let BASE_URL;

before(async () => {
  // Start Express on an available port.
  server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  BASE_URL = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
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
test("Valid AI reply is returned successfully", async () => {
  // Mock Gemini so no real API call is made.
  app.locals.generateContent = async () => ({
    text: "REPLY_NEEDED: Thank you for your email. I appreciate the update.",
  });

  const response = await fetch(`${BASE_URL}/generate-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "Hi, could you please acknowledge this update?",
      tone: "Professional",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.noReplyNeeded, false);
  assert.match(data.reply, /Thank you for your email/);
});

test("Email that needs no reply is classified correctly", async () => {
  // Mock Gemini: this email does not require a response.
  app.locals.generateContent = async () => ({
    text: "NO_REPLY_NEEDED: This is an informational newsletter.",
  });

  const response = await fetch(`${BASE_URL}/generate-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "Here is our weekly newsletter. No response is necessary.",
      tone: "Professional",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.noReplyNeeded, true);
  assert.match(data.reply, /informational newsletter/i);
});

test("Invalid AI classification returns HTTP 502", async () => {
  // Simulate an unexpected AI response.
  app.locals.generateContent = async () => ({
    text: "Here is something unexpected from the AI.",
  });

  const response = await fetch(`${BASE_URL}/generate-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "Please confirm whether you received my email.",
      tone: "Professional",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 502);
  assert.ok(data.error);
});

test("AI generation failure returns HTTP 500", async () => {
  // Simulate a Gemini API failure.
  app.locals.generateContent = async () => {
    throw new Error("Simulated Gemini API failure");
  };

  const response = await fetch(`${BASE_URL}/generate-reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "Could you please confirm receipt?",
      tone: "Professional",
    }),
  });

  const data = await response.json();

  assert.equal(response.status, 500);
  assert.equal(
    data.error,
    "Unable to generate a reply. Please try again."
  );
});