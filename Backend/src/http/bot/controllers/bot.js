const { OpenAI } = require("openai");
const CONFIG = require("../../../config/config");
require("dotenv").config();

const openaiClient = new OpenAI({
  apiKey: CONFIG.openai.apiKey,
});

class BotController {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }

  async createThread() {
    try {
      const myThread = await openaiClient.beta.threads.create();
      console.log("New thread created with ID: ", myThread.id, "\n");
      return myThread.id;
    } catch (error) {
      console.error("Error creating thread:", error);
      throw new Error("Internal server error");
    }
  }

  async ask() {
    try {
      const { message, sThread } = this.req.body;

      console.log("Message:---", message);

      let threadId = sThread;

      if (!threadId) {
        threadId = await this.createThread();
      }
      console.log("Thread:---", threadId);

      // Add a message to the thread
      await openaiClient.beta.threads.messages.create(threadId, {
        role: "user",
        content: message,
      });

      // Run the assistant with the provided thread
      const run = await openaiClient.beta.threads.runs.create(threadId, {
        assistant_id: "asst_bGWxB6VTb9iZd5lFo8nXvW58",
      });

      // Wait for the run to complete
      await this.waitForRunComplete(threadId, run.id);

      // Retrieve messages from the thread
      const threadMessages = await openaiClient.beta.threads.messages.list(
        threadId
      );

      // Extract the latest assistant message
      const latestMessage = threadMessages.data
        .filter((msg) => msg.role === "assistant")
        .pop(); 

      const response = {
        id: latestMessage ? latestMessage.id : null,
        thread_id: threadId,
        value: latestMessage
          ? latestMessage.content[0]?.text.value
          : "No response from assistant",
      };
      // Send the thread messages and thread ID as a response
      this.res.json({
        response: response,
      });
    } catch (error) {
      console.error("Error getting assistant response:", error);
      this.res.status(500).json({ error: "Internal server error" });
    }
  }

  // Define a function to wait for a run to complete
  async waitForRunComplete(sThreadId, sRunId) {
    while (true) {
      const oRun = await openaiClient.beta.threads.runs.retrieve(
        sThreadId,
        sRunId
      );
      if (
        oRun.status &&
        (oRun.status === "completed" ||
          oRun.status === "failed" ||
          oRun.status === "requires_action")
      ) {
        break; // Exit loop if run is completed, failed, or requires action
      }
      // Delay the next check to avoid high frequency polling
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
    }
  }
}

module.exports = BotController;
