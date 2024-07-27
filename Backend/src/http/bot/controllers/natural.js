const fs = require("fs");
const path = require("path");
const natural = require("natural");

// Paths
const productsDataPath = path.join(__dirname, "../../../../data/products.json");
const outputFilePath = path.join(__dirname, "../../../../data/flattened_products.json");
const textFilePath = path.join(__dirname, "../../../../data/products.txt");

// Load and parse the JSON data
const rawData = fs.readFileSync(productsDataPath);
const productsData = JSON.parse(rawData);

// Function to flatten the product data for easier querying
const flattenProducts = () => {
  const flattened = [];
  Object.keys(productsData).forEach((signage) => {
    productsData[signage].forEach((item) => {
      flattened.push({
        signage,
        ...item,
      });
    });
  });
  return flattened;
};

// Initialize the tokenizer and stemmer
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Function to preprocess and tokenize input
const preprocessInput = (input) => {
  return tokenizer
    .tokenize(input.toLowerCase())
    .map((word) => stemmer.stem(word));
};

// Function to generate a response based on user query
const generateResponse = (query) => {
  const tokens = preprocessInput(query);

  let bestMatch = null;
  let highestScore = 0;

  const flattenedProducts = JSON.parse(fs.readFileSync(outputFilePath));

  flattenedProducts.forEach((product) => {
    const productDescription = preprocessInput(product.Description);
    const productName = preprocessInput(product.subcategory);
    const productSignalWord = preprocessInput(product.SignalWord);

    // Score calculation
    const descriptionScore = tokens.filter((token) =>
      productDescription.includes(token)
    ).length;
    const nameScore = tokens.filter((token) =>
      productName.includes(token)
    ).length;
    const signalWordScore = tokens.filter((token) =>
      productSignalWord.includes(token)
    ).length;
    const totalScore = descriptionScore + nameScore + signalWordScore;

    if (totalScore > highestScore) {
      highestScore = totalScore;
      bestMatch = product;
    }
  });

  if (bestMatch) {
    return `Here's the information I found:\nSignCode: ${bestMatch.SignCode}\nSignalWord: ${bestMatch.SignalWord}\nSubcategory: ${bestMatch.subcategory}\nDescription: ${bestMatch.Description}\nPicto: ${bestMatch.Picto}\nSize: ${bestMatch.Size}\nIndustry: ${bestMatch.Industry}\nImage: ${bestMatch.Image}`;
  } else {
    return "Sorry, I couldn't find any information matching your query.";
  }
};

// Function to convert flattened data to readable text format
const convertToTextFormat = () => {
  const flattenedProducts = JSON.parse(fs.readFileSync(outputFilePath));
  let textContent = "";

  flattenedProducts.forEach((product) => {
    textContent += `SignCode: ${product.SignCode}\n`;
    textContent += `SignalWord: ${product.SignalWord}\n`;
    textContent += `Subcategory: ${product.subcategory}\n`;
    textContent += `Description: ${product.Description}\n`;
    textContent += `Picto: ${product.Picto}\n`;
    textContent += `Size: ${product.Size}\n`;
    textContent += `Industry: ${product.Industry}\n`;
    textContent += `Image: ${product.Image}\n`;
    textContent += "----------------------------------------\n\n";
  });

  fs.writeFileSync(textFilePath, textContent, "utf-8");
  console.log(`Readable text data has been written to ${textFilePath}`);
};

class NaturalController {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }

  async flattenProducts() {
    const flattenedProducts = flattenProducts();
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify(flattenedProducts, null, 2),
      "utf-8"
    );
    console.log(`Flattened data has been written to ${outputFilePath}`);
    this.res.json({ message: "Flattened data has been stored successfully." });
  }

  async chat() {
    const { message } = this.req.body;
    console.log("Message:--", message);
    const response = generateResponse(message);
    console.log("Response:---", response);
    this.res.json({ response });
  }

  async convertToText() {
    convertToTextFormat();
    this.res.json({
      message: "Readable text format data has been stored successfully.",
    });
  }
}

module.exports = NaturalController;
