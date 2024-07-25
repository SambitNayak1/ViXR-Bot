const Express = require("express");
const Router = Express.Router();

const BotController = require("./controllers/bot");
const TableController = require("./controllers/table");

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
    router.post("/makeTable", ToCntlr(TableController, "makeTable"));

    return router;
  })(Express.Router())
);

module.exports = Router;
