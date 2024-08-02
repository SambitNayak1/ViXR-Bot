const path = require("path");
const { OpenAI } = require("openai");
const CONFIG = require("../../../config/config");
require("dotenv").config();
const fs = require("fs");

const openaiClient = new OpenAI({
  apiKey: CONFIG.openai.apiKey,
});

console.log("Assistant ID: ", CONFIG.openai.assistant_id);

class AudioController {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }

  //use whisper-1 model
  async speechToText() {
    try {
      const audioFile = path.join(__dirname, "../../../../data/sample-2.wav");
      if (!audioFile) {
        return this.res.status(400).json({ error: "Invalid file format" });
      }
      console.log("File:---", audioFile);
      const response = await openaiClient.audio.transcriptions.create({
        model: "whisper-1",
        file: fs.createReadStream(audioFile),
        response_format: "text",
      });
      console.log("Response:---", response);
      return this.res.json({ response });
    } catch (error) {
      console.error("Error:", error);
      throw new Error("Internal server error");
    }
  }
}

module.exports = AudioController;
