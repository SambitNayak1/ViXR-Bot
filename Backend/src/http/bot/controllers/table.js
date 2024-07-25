class TableController {
  constructor(req, resp) {
    this.req = req;
    this.resp = resp;
  }

  // Convert text to table
  async makeTable() {
    const { text } = this.req.body;
    console.log("Text:---", text);

    if (!text || typeof text !== "string") {
      return this.resp.status(400).json({ error: "Invalid text format" });
    }

    // Find out if the text has SignCode, SignalWord, Size, Image, Description
    const wordsToFind = [
      "SignCode",
      "SignalWord",
      "Subcategory",
      "Size",
      "Image",
      "Description",
    ];

    function extractValues(str, words) {
      const result = {};
      // Remove any additional commas from the text
      str = str.replace(/,\s+(?=[A-Z])/g, ",");

      // Split the string into parts based on commas
      const parts = str.split(/,\s*(?![^()]*\))/);

      // Extract values based on the key
      parts.forEach((part) => {
        words.forEach((word) => {
          const regex = new RegExp(`${word}:\\s*([^,]+)`, "i");
          const match = part.match(regex);
          if (match) {
            result[word] = match[1].trim();
          }
        });
      });

      // Handle the 'Description' field separately to capture the remaining part
      const descriptionRegex = new RegExp(`Description:\\s*(.*?)(?:,|$)`, "s");
      const descriptionMatch = str.match(descriptionRegex);
      if (descriptionMatch) {
        result["Description"] = descriptionMatch[1].trim();
      }

      return result;
    }

    const extractedValues = extractValues(text, wordsToFind);
    console.log("ExtractValues:---", extractedValues);

    // Convert to table format
    const table = {
      columns: wordsToFind,
      rows: [wordsToFind.map((word) => extractedValues[word] || "N/A")],
    };

    console.log("table:---", table);
    return this.resp.status(200).json({
      type: typeof text,
      table: table,
    });
  }
}

module.exports = TableController;
