// ==========================================
// ReplyCraft AI — Side Panel Logic
// ==========================================

const emailInput = document.getElementById("email");
const toneSelect = document.getElementById("tone");
const instructionsInput = document.getElementById("instructions");

const generateButton = document.getElementById("generate");
const regenerateButton = document.getElementById("regenerate");
const copyButton = document.getElementById("copy");
const resultBox = document.getElementById("result");

const loadGmailButton = document.getElementById("load-gmail");
const insertGmailButton = document.getElementById("insert-gmail");

// ==========================================
// STATE
// ==========================================

let generatedReply = "";
let noReplyNeeded = false;
let isGenerating = false;
let isInserting = false;

// ==========================================
// DISPLAY STATUS
// ==========================================

function showStatus(message) {
  resultBox.textContent = message;
}

// ==========================================
// UPDATE BUTTON STATES
// ==========================================

function updateActionButtons() {
  const hasReply =
    Boolean(generatedReply.trim()) && !noReplyNeeded;

  copyButton.disabled = !hasReply;

  regenerateButton.disabled =
    !hasReply || isGenerating;

  insertGmailButton.disabled =
    !hasReply || isInserting;
}

// ==========================================
// CLEAR PREVIOUS RESULT
// ==========================================

function clearGeneratedReply() {
  generatedReply = "";
  noReplyNeeded = false;

  updateActionButtons();
}

// ==========================================
// GENERATE OR REGENERATE REPLY
// ==========================================

async function generateReply() {
  if (isGenerating) {
    return;
  }

  const email = emailInput.value.trim();

  if (!email) {
    clearGeneratedReply();

    showStatus(
      "Please load or paste the email you want to reply to."
    );

    emailInput.focus();
    return;
  }

  isGenerating = true;

  generateButton.disabled = true;
  generateButton.textContent = "Generating...";

  regenerateButton.textContent = "Generating...";

  updateActionButtons();

  showStatus(
    "Analyzing the email and preparing your result..."
  );

 try {
  const response = await fetch(
    "https://replycraft-ai.onrender.com/generate-reply",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        tone: toneSelect.value,
        instructions: instructionsInput.value.trim(),
      }),
    }
  );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Unable to generate a reply."
      );
    }

    // Validate the backend response.
    if (
      typeof data.reply !== "string" ||
      !data.reply.trim()
    ) {
      throw new Error(
        "The AI returned an empty result. Please try again."
      );
    }

    // Clear the previous result before handling the new one.
    clearGeneratedReply();

    // Log classification for debugging.
    console.log("ReplyCraft AI backend response:", data);

    // ==========================================
    // CASE 1: NO REPLY IS NEEDED
    // ==========================================

    if (data.noReplyNeeded === true) {
      noReplyNeeded = true;

      showStatus(
        "NO REPLY NEEDED\n\n" +
        data.reply.trim() +
        "\n\nCopying, regenerating, and inserting a reply are disabled."
      );

      return;
    }

    // ==========================================
    // CASE 2: REPLY IS NEEDED
    // ==========================================

    if (data.noReplyNeeded !== false) {
      throw new Error(
        "The AI response did not include a valid reply classification."
      );
    }

    generatedReply = data.reply.trim();

    showStatus(generatedReply);

  } catch (error) {
    console.error(
      "Reply generation failed:",
      error
    );

    clearGeneratedReply();

    const message =
      error.message || "An unexpected error occurred.";

    if (
      message.includes("Failed to fetch") ||
      message.includes("NetworkError")
    ) {
      showStatus(
        "Couldn't connect to the AI server. " +
        "Please check that your backend is running."
      );
    } else {
      showStatus(
        `Couldn't generate a reply: ${message}`
      );
    }

  } finally {
    isGenerating = false;

    generateButton.disabled = false;

    generateButton.innerHTML =
      "<span>✦</span> Generate reply";

    regenerateButton.textContent = "↻ Regenerate";

    updateActionButtons();
  }
}

// ==========================================
// GENERATE FIRST REPLY
// ==========================================

generateButton.addEventListener(
  "click",
  generateReply
);

// ==========================================
// REGENERATE REPLY
// ==========================================

regenerateButton.addEventListener(
  "click",
  generateReply
);

// ==========================================
// COPY GENERATED REPLY
// ==========================================

copyButton.addEventListener(
  "click",
  async () => {
    if (!generatedReply || noReplyNeeded) {
      showStatus(
        "There is no email draft to copy."
      );

      updateActionButtons();
      return;
    }

    try {
      await navigator.clipboard.writeText(
        generatedReply
      );

      copyButton.textContent = "Copied!";

      setTimeout(() => {
        copyButton.textContent = "Copy";
      }, 1500);

    } catch (error) {
      console.error("Copy failed:", error);

      showStatus(
        "Couldn't copy the reply. Please try again."
      );
    }
  }
);

// ==========================================
// LOAD EMAIL FROM GMAIL
// ==========================================

loadGmailButton.addEventListener(
  "click",
  async () => {
    loadGmailButton.disabled = true;

    loadGmailButton.textContent =
      "Loading email...";

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (
        !tab?.id ||
        !tab.url?.startsWith(
          "https://mail.google.com/"
        )
      ) {
        throw new Error(
          "Open Gmail and select an email first."
        );
      }

      let response;

      try {
        response = await chrome.tabs.sendMessage(
          tab.id,
          {
            action: "GET_GMAIL_EMAIL",
          }
        );

      } catch {
        await chrome.scripting.executeScript({
          target: {
            tabId: tab.id,
          },

          files: ["gmail.js"],
        });

        response = await chrome.tabs.sendMessage(
          tab.id,
          {
            action: "GET_GMAIL_EMAIL",
          }
        );
      }

      if (!response?.success) {
        throw new Error(
          response?.error ||
          "Couldn't read the Gmail email."
        );
      }

      emailInput.value = response.email;

      // Prevent an old draft from being used for a new email.
      clearGeneratedReply();

      showStatus(
        "Email loaded! Choose a tone and generate your reply."
      );

    } catch (error) {
      console.error(
        "Gmail loading failed:",
        error
      );

      showStatus(
        error.message ||
        "Couldn't load the Gmail email."
      );

    } finally {
      loadGmailButton.disabled = false;

      loadGmailButton.textContent =
        "📩 Load email from Gmail";
    }
  }
);

// ==========================================
// INSERT REPLY INTO GMAIL
// ==========================================

insertGmailButton.addEventListener(
  "click",
  async () => {
    if (
      !generatedReply ||
      noReplyNeeded ||
      isInserting
    ) {
      showStatus(
        "There is no email draft to insert into Gmail."
      );

      updateActionButtons();
      return;
    }

    isInserting = true;

    insertGmailButton.textContent =
      "Inserting...";

    updateActionButtons();

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (
        !tab?.id ||
        !tab.url?.startsWith(
          "https://mail.google.com/"
        )
      ) {
        throw new Error(
          "Open Gmail before inserting your reply."
        );
      }

      let response;

      try {
        response = await chrome.tabs.sendMessage(
          tab.id,
          {
            action: "INSERT_GMAIL_REPLY",
            reply: generatedReply,
          }
        );

      } catch {
        await chrome.scripting.executeScript({
          target: {
            tabId: tab.id,
          },

          files: ["gmail.js"],
        });

        response = await chrome.tabs.sendMessage(
          tab.id,
          {
            action: "INSERT_GMAIL_REPLY",
            reply: generatedReply,
          }
        );
      }

      if (!response?.success) {
        throw new Error(
          response?.error ||
          "Couldn't insert the reply."
        );
      }

      showStatus(
        "Reply inserted into Gmail!\n\n" +
        "Please review the draft before sending."
      );

    } catch (error) {
      console.error(
        "Gmail insertion failed:",
        error
      );

      showStatus(
        error.message ||
        "Couldn't insert the reply into Gmail."
      );

    } finally {
      isInserting = false;

      insertGmailButton.textContent =
        "Insert into Gmail";

      updateActionButtons();
    }
  }
);

// ==========================================
// INITIAL STATE
// ==========================================

copyButton.textContent = "Copy";

regenerateButton.textContent = "↻ Regenerate";

updateActionButtons();