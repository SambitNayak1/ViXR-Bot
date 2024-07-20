const openai = require("openai");
const CONFIG = require("../../../config/config");
require("dotenv").config();

console.log("OpenAI API Key:", CONFIG.openai.apiKey);

const openaiClient = new openai({
  apiKey: CONFIG.openai.apiKey,
});

// Data access from the source
const productData = require("../../../../data/products.json");

class BotController {
  constructor(req, resp) {
    this.req = req;
    this.resp = resp;
  }

  /* This function sends a request to the OpenAI API to create an embedding for the given text.
 Embeddings are numerical representations of text that capture semantic meaning. */

  async getEmbedding(text) {
    console.log("Text:--", text);
    try {
      const response = await openaiClient.embeddings.create({
        input: text,
        model: "text-embedding-ada-002",
      });
      console.log("Embedding response:--", response.data);
      if (response.data && response.data.length > 0) {
        return response.data[0].embedding;
      } else {
        throw new Error("Invalid response from embedding API");
      }
    } catch (error) {
      console.error("Error while getting embedding", error);
      throw error;
    }
  }

  async findRelevantProductData(query) {
    console.log("Query:--", query);
    const queryEmbedding = await this.getEmbedding(query);
    let mostRelevant = null;
    let highestSimilarity = -1;

    for (const product of productData) {
      console.log("Product:--", product);
      const productText = `${product.name} ${product.description} ${product.specs} ${product.price}`;
      const productEmbedding = await this.getEmbedding(productText);

      const similarity = this.cosineSimilarity(
        queryEmbedding,
        productEmbedding
      );

      if (similarity > highestSimilarity) {
        highestSimilarity = similarity;
        mostRelevant = product;
      }
    }

    return mostRelevant;
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((acc, val, idx) => acc + val * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
  async chat() {
    const { message } = this.req.body;
    console.log("Message:--", message);
    try {
      const relevantProduct = await this.findRelevantProductData(message);
      console.log("Relevant Product:--", relevantProduct);
      const context = relevantProduct
        ? `${relevantProduct.name}: ${relevantProduct.description} ${relevantProduct.specs} ${relevantProduct.price}`
        : "";

      console.log("Context:--", context);

      if (!context || context == null) {
        throw new Error("Context not found");
      }
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", context: context },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 150,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      console.log("Response:--", response);
      return this.resp
        .status(200)
        .json({ message: response.choices[0].message.content });
    } catch (error) {
      console.error("Error while chatting", error);
      return this.resp.status(500).json({ error: error.message });
    }
  }
}

module.exports = BotController;
