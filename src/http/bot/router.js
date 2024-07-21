const Express = require("express");
const Router = Express.Router();

const BotController = require("./controllers/bot");

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
    router.post("/chat", ToCntlr(BotController, "chat"));
    router.post("/train", ToCntlr(BotController, "train"));
    router.post("/getFineTune", ToCntlr(BotController, "retrieveFineTune"));
    return router;
  })(Express.Router())
);

module.exports = Router;
