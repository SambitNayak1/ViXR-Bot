const { OpenAI } = require("openai");
const CONFIG = require("../../../config/config");
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const nlp = require("compromise");

console.log("ApiKey:--", CONFIG.openai.apiKey);

const openaiClient = new OpenAI({
  apiKey: CONFIG.openai.apiKey,
});

const productsDataPath = path.join(__dirname, "../../../../data/products.json");

class BotController {
  constructor(req, resp) {
    this.req = req;
    this.resp = resp;
    this.products = {};
    this.signageCategories = [];
  }

  async initialize() {
    this.products = await this.loadProducts();
    this.signageCategories = Object.keys(this.products);
  }

  static async createEmbeddingsForProducts(products) {
    const productsWithEmbeddings = {};

    for (const category in products) {
      productsWithEmbeddings[category] = [];

      for (const product of products[category]) {
        try {
          const response = await openaiClient.embeddings.create({
            model: "text-embedding-ada-002",
            input: product.Description,
          });
          productsWithEmbeddings[category].push({
            ...product,
            embedding: response.data[0].embedding,
          });
        } catch (error) {
          console.error("Error generating embedding for product:", error);
        }
      }
    }

    return productsWithEmbeddings;
  }

  async loadProducts() {
    try {
      const data = fs.readFileSync(productsDataPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading products.json:", error);
      return {};
    }
  }

  extractProductName(message) {
    console.log("Message:--", message);
    const doc = nlp(message);
    const nouns = doc
      .nouns()
      .out("array")
      .map((noun) => noun.toLowerCase());
    const words = message
      .split(" ")
      .map((word) =>
        word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").toLowerCase()
      );

    console.log("Nouns:--", nouns);
    console.log("Words:--", words);

    for (const category in this.products) {
      for (const product of this.products[category]) {
        if (!product.Description) {
          continue;
        }
        const productDescription = product.Description.toLowerCase();
        const productID = product.SignCode.toLowerCase();
        if (
          words.includes(productDescription) ||
          nouns.includes(productDescription) ||
          message.toLowerCase().includes(productDescription) ||
          message.toLowerCase().includes(productID)
        ) {
          return product.Description;
        }
      }
    }

    const lowerCaseMessage = message.toLowerCase();
    for (const category in this.products) {
      if (lowerCaseMessage.includes(category.toLowerCase())) {
        return category;
      }
    }

    return null;
  }

  async ask() {
    const { message } = this.req.body;
    if (!message || typeof message !== "string") {
      return this.resp.status(400).json({ error: "Invalid message format" });
    }

    // Initialize products data
    await this.initialize();

    // Regular expression to match different ways of asking for the number of signages
    const numberOfSignagesRegex =
      /number of signages|how many signages|signages available/i;
    // Regular expression to match different ways of asking for the signage categories
    const signageCategoriesRegex =
      /all signages|available signages|signage categories/i;

    if (numberOfSignagesRegex.test(message.toLowerCase())) {
      const totalSignageCategories = this.signageCategories.length;
      return this.resp.send({
        response: `There are ${totalSignageCategories} signage categories available.`,
      });
    }
    if (signageCategoriesRegex.test(message.toLowerCase())) {
      console.log("Signage Categories:--", this.signageCategories);
      return this.resp.send({
        response: `The available signage categories are: ${this.signageCategories.join(
          ", "
        )}.`,
      });
    }

    const extractedName = this.extractProductName(message);
    console.log("Extracted Product Name:--", extractedName);

    if (extractedName) {
      const product = await this.findProductByName(extractedName);
      if (product) {
        const prompt = `The user asked: "${message}". Provide a detailed response about the product in a conversational format:\n
      SignCode: ${product.SignCode || "N/A"}
      SignalWord: ${product.SignalWord || "N/A"}
      Subcategory: ${product.Subcategory || "N/A"}
      Description: ${product.Description || "N/A"}
      Picto: ${product.Picto || "N/A"}
      Format: ${product.Format || "N/A"}
      Size: ${product.Size || "N/A"}
      Industry: ${product.Industry || "N/A"}
      Image: ${product.Image || "N/A"}
      Material: ${product.Material || "N/A"}
      Lamination: ${product.Lamination || "N/A"}
      Backing: ${product.Backing || "N/A"}
      Mounting: ${product.Mounting || "N/A"}

      Please provide a friendly and informative response.`;

        console.log("Prompt:--", prompt);
        try {
          const response = await openaiClient.completions.create({
            model: "davinci-002",
            prompt: prompt,
            max_tokens: 150,
            temperature: 0.3,
          });

          console.log("Response:--", response);
          const answer = response.choices[0].text
            .replace(/\n+/g, " ") // Replace newlines with a single space
            .replace(/\s{2,}/g, " ") // Replace multiple spaces with a single space
            .trim(); // Remove any leading or trailing whitespace
          return this.resp.send({
            response: answer,
          });
        } catch (error) {
          console.error("Error while asking:--", error);
          return this.resp
            .status(500)
            .json({ error: "Error generating response from OpenAI" });
        }
      } else {
        return this.resp.status(404).json({ error: "Product not found" });
      }
    } else {
      try {
        const response = await openaiClient.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant" },
            { role: "user", content: message },
          ],
          max_tokens: 200,
          temperature: 0.5,
        });
        const responseContent = response.choices[0].message.content
          .replace(/\n+/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();

        console.log("Response:--", response.choices[0].message);
        return this.resp.send({
          response: responseContent,
        });
      } catch (error) {
        console.error("Error while asking:--", error);
        return this.resp
          .status(500)
          .json({ error: "Error generating response from OpenAI" });
      }
    }
  }

  //find product from the category by name
  async findProductByName(name) {
    console.log("Searching for product by name:", name);
    const normalizedName = name.toLowerCase();

    for (const category in this.products) {
      const foundProduct = this.products[category].find(
        (product) =>
          product.Description.toLowerCase() === normalizedName ||
          product.Description.toLowerCase().includes(normalizedName)
      );

      if (foundProduct) return foundProduct;
    }

    return null;
  }
}

module.exports = BotController;
