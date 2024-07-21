const { OpenAI } = require("openai");
const CONFIG = require("../../../config/config");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

console.log("OpenAI API Key:--", CONFIG.openai.apiKey);

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class BotController {
  constructor(req, resp) {
    this.req = req;
    this.resp = resp;
  }

  //Fine-Tune
  async train() {
    try {
      //file path
      const filePath = path.join(__dirname, "../../../../data/products.jsonl");
      // Upload file to OpenAI
      const file = fs.createReadStream(filePath);
      //File Upload
      const uploadResponse = await openaiClient.files.create({
        purpose: "fine-tune",
        file: file,
      });

      console.log("Upload Response:--", uploadResponse);

      //Fine Tune
      const fineTuneResponse = await openaiClient.fineTuning.jobs.create({
        training_file: uploadResponse.id,
        model: "gpt-3.5-turbo",
      });
      console.log("FineTuneResponse:--", fineTuneResponse);
      return this.resp.status(200).json({
        message: "File uploaded and fine-tuning initiated",
        data: fineTuneResponse,
      });
    } catch (error) {
      console.error("Error while uploading file:--", error);
      return this.resp.status(400).json({ error: error });
    }
  }

  async retrieveFineTune() {
    try {
      const statusResponse = await openaiClient.fineTuning.jobs.retrieve(
        "ftjob-9ykJncTBMJpUWyrU73HY2kdY"
      );
      console.log("FineTuneStatus:--", statusResponse);
      return this.resp.status(200).json({ data: statusResponse });
    } catch (error) {
      console.error("Error while checking fine-tune status:--", error);
    }
  }

  //Generate responses
  async chat() {
    const { message } = this.req.body;

    if (!message || typeof message !== "string") {
      return this.resp.status(400).json({ error: "Invalid message format" });
    }

    try {
      const response = await openaiClient.chat.completions.create({
        model: "gpt-3.5-turbo-0125",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 50,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      console.log("Response:---", response);

      return this.resp
        .status(200)
        .json({ message: response.choices[0].message.content });
    } catch (error) {
      console.error("Error while chatting", error);
      return this.resp.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = BotController;
