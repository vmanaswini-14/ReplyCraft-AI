// ==========================================
// ReplyCraft AI — Gmail Integration
// ==========================================

// ==========================================
// HELPER: WAIT FOR AN ELEMENT
// ==========================================

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const existingElement = document.querySelector(selector);

    if (existingElement) {
      resolve(existingElement);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);

      if (element) {
        observer.disconnect();
        clearTimeout(timer);
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// ==========================================
// HELPER: FIND GMAIL REPLY EDITOR
// ==========================================

function findReplyEditor() {
  const editors = Array.from(
    document.querySelectorAll(
      '[role="textbox"][contenteditable="true"]'
    )
  );

  return editors.find((editor) => {
    const label = (
      editor.getAttribute("aria-label") || ""
    ).toLowerCase();

    // Exclude Gmail's search box.
    if (label === "search") {
      return false;
    }

    // Exclude hidden or unavailable editors.
    if (
      !editor.isConnected ||
      editor.getClientRects().length === 0
    ) {
      return false;
    }

    // Prefer an editor that belongs to a reply or forward
    // composer rather than an unrelated editable element.
    return true;
  }) || null;
}

// ==========================================
// HELPER: OPEN GMAIL REPLY EDITOR
// ==========================================

async function openReplyEditor() {
  // If a reply editor is already open, use it.
  let editor = findReplyEditor();

  if (editor) {
    return editor;
  }

  // Find Gmail's Reply button.
  const replyButtons = Array.from(
    document.querySelectorAll(
      '[role="button"], button'
    )
  );

  const replyButton = replyButtons.find((button) => {
    const label = (
      button.getAttribute("aria-label") || ""
    ).toLowerCase();

    const text = (
      button.innerText || ""
    ).trim().toLowerCase();

    return (
      label === "reply" ||
      label.startsWith("reply to ") ||
      text === "reply"
    );
  });

  if (!replyButton) {
    throw new Error(
      "Couldn't find Gmail's Reply button. Open an email conversation and try again."
    );
  }

  // Open the reply composer.
  replyButton.click();

  // Wait for Gmail to render the reply editor.
  editor = await waitForElement(
    '[role="textbox"][contenteditable="true"]',
    7000
  );

  // Re-check using our editor filter.
  editor = findReplyEditor();

  if (!editor) {
    throw new Error(
      "Gmail's reply editor did not open. Please open it manually and try again."
    );
  }

  return editor;
}

// ==========================================
// MESSAGE LISTENER
// ==========================================

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {

    // ==========================================
    // LOAD THE CURRENT GMAIL EMAIL
    // ==========================================

    if (message.action === "GET_GMAIL_EMAIL") {
      try {
        const emailBodies = Array.from(
          document.querySelectorAll(".a3s")
        ).filter((element) => {
          return element.innerText.trim();
        });

        if (emailBodies.length === 0) {
          sendResponse({
            success: false,
            error: "Open an email in Gmail first.",
          });

          return;
        }

        const emailBody =
          emailBodies[emailBodies.length - 1]
            .innerText.trim();

        const subjectElement =
          document.querySelector(".hP");

        const subject = subjectElement
          ? subjectElement.innerText.trim()
          : "";

        sendResponse({
          success: true,

          email: subject
            ? `Subject: ${subject}\n\n${emailBody}`
            : emailBody,
        });

      } catch (error) {
        console.error(
          "Gmail email loading failed:",
          error
        );

        sendResponse({
          success: false,
          error: "Unable to read the email from Gmail.",
        });
      }

      return true;
    }

    // ==========================================
    // INSERT AI REPLY INTO GMAIL
    // ==========================================

    if (message.action === "INSERT_GMAIL_REPLY") {
      (async () => {
        try {
          const replyText = message.reply;

          if (
            typeof replyText !== "string" ||
            !replyText.trim()
          ) {
            sendResponse({
              success: false,
              error: "There is no reply to insert.",
            });

            return;
          }

          // Open the reply editor automatically if needed.
          const editor = await openReplyEditor();

          // Focus the Gmail editor.
          editor.focus();

          // Select existing editor contents so the generated
          // reply replaces any existing draft text.
          const selection = window.getSelection();
          const range = document.createRange();

          range.selectNodeContents(editor);

          selection.removeAllRanges();
          selection.addRange(range);

          // Insert the AI-generated reply as plain text.
          const inserted = document.execCommand(
            "insertText",
            false,
            replyText.trim()
          );

          if (!inserted) {
            sendResponse({
              success: false,
              error:
                "Couldn't insert the reply. Please use Copy instead.",
            });

            return;
          }

          // Notify Gmail of the editor change.
          editor.dispatchEvent(
            new InputEvent("input", {
              bubbles: true,
              inputType: "insertText",
              data: replyText.trim(),
            })
          );

          sendResponse({
            success: true,
          });

        } catch (error) {
          console.error(
            "Gmail reply insertion failed:",
            error
          );

          sendResponse({
            success: false,
            error:
              error.message ||
              "Unable to insert the reply into Gmail.",
          });
        }
      })();

      // Keep the message channel open for the async operation.
      return true;
    }
  }
);