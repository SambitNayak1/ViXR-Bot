const Express = require("express");
const Router = Express.Router();

const BotController = require("./controllers/bot");
const TableController = require("./controllers/table");
const NaturalController = require("./controllers/natural");
const AudioController = require("./controllers/speechText");
//const GroqController = require("./controllers/groq");

const ToCntlr = function (controllerClass, action) {
  return async function (req, resp, next) {
    try {
      let controller = new controllerClass(req, resp);
      return await controller[action]();
    } catch (error) {
      next(error);
    }
  };
};

Router.use(
  "/bot",
  (function (router) {
    router.post("/ask", ToCntlr(BotController, "ask"));
    router.post("/chat", ToCntlr(NaturalController, "chat"));
    router.post("/flatten", ToCntlr(NaturalController, "flattenProducts"));
    router.post("/makeTable", ToCntlr(TableController, "makeTable"));
    router.post("/toText", ToCntlr(NaturalController, "convertToText"));
    //router.post("/query", ToCntlr(GroqController, "main"));

    router.post("/speech", ToCntlr(AudioController, "speechToText"));

    return router;
  })(Express.Router())
);

module.exports = Router;
