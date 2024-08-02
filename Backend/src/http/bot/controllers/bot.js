const { OpenAI } = require("openai");
const CONFIG = require("../../../config/config");
require("dotenv").config();

const openaiClient = new OpenAI({
  apiKey: CONFIG.openai.apiKey,
});

console.log("Assistant ID: ", CONFIG.openai.assistant_id);

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
      const { type, audio, message, sThread } = this.req.body;

      if (type == "audio" && audio) {
        const audioFile = path.join(__dirname, "../../../../data/sample2.m4a");
        if (!audioFile) {
          return this.res.status(400).json({ error: "Invalid file format" });
        }
        console.log("File:---", audioFile);
        try {
          const transcriptionResponse =
            await openaiClient.audio.transcriptions.create({
              model: "whisper-1",
              file: fs.createReadStream(audioFile),
              response_format: "text",
            });
          const transcribedText = transcriptionResponse.text;
          console.log("Transcribed Text:---", transcribedText);
        } catch (error) {
          console.log("Transcription Error:---", error);
          return this.res
            .status(404)
            .json({ message: "Transcription Error", error: error });
        }
      } else if (type === "text" && message) {
        const transcribedText = message;
      } else {
        return this.res
          .status(400)
          .json({ error: "Invalid request type or missing" });
      }

      let threadId = sThread;

      if (!threadId) {
        threadId = await this.createThread();
      }
      console.log("Thread:---", threadId);

      // Add a message to the thread
      await openaiClient.beta.threads.messages.create(threadId, {
        role: "user",
        content: transcribedText,
      });

      // Run the assistant with the provided thread
      const run = await openaiClient.beta.threads.runs.create(threadId, {
        assistant_id: CONFIG.openai.assistant_id,
        model: "gpt-3.5-turbo",
      });

      // Wait for the run to complete with a timeout
      const runResult = await this.waitForRunComplete(threadId, run.id);
      if (!runResult) {
        throw new Error("Run timed out");
      }

      // Retrieve messages from the thread
      const threadMessages = await openaiClient.beta.threads.messages.list(
        threadId
      );

      // Extract the latest assistant message
      const latestMessage = threadMessages.data
        .filter((msg) => msg.role === "assistant")
        .pop();

      console.log("Latest Message:---", latestMessage);
      const response = {
        id: latestMessage ? latestMessage.id : null,
        thread_id: threadId,
        created_at: latestMessage ? latestMessage.created_at : null,
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

  // Define a function to wait for a run to complete with a timeout
  async waitForRunComplete(sThreadId, sRunId) {
    const timeout = 30000; // 30 seconds
    const start = Date.now();

    while (Date.now() - start < timeout) {
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
        return oRun; // Exit loop if run is completed, failed, or requires action
      }
      // Delay the next check to avoid high frequency polling
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
    }

    console.error(`Run ${sRunId} timed out`);
    return null; // Return null if the run times out
  }
}

module.exports = BotController;
