const cors = require("cors");
const express = require("express");
const router = express.Router();
const corsOptions = {
  origin: true,
  credentials: true,
};
router.use(cors(corsOptions));

//main router
router.use("/v1", require("./http/bot/router"));

//Invalid route
router.use("*", (req, res) => {
  res.status(404).send({ message: "Invalid route" });
});

module.exports = router;
