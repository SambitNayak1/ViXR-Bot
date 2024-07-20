require("dotenv").config();

function GenericConfig() {
  return {
    env: process.env.ENV || "local",
    port: process.env.NODE_PORT || 4000,
    openai: {
      apiKey: process.env.OPENAI_API_KEY || null,
    },
  };
}

module.exports = GenericConfig();
