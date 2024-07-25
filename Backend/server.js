const express = require("express");
const app = express();
const cors = require("cors");

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ extended: true }));

const CONFIG = require("./src/config/config");
const router = require("./src/router");
app.use("/", router);

app.get("/", (req, res) => {
  res.send("Hello From Sambit!!!");
});

app.listen(CONFIG.port, (error) => {
  if (error) {
    console.log(error);
    return;
  }
  console.log("port:--", CONFIG.port);
  console.log(`App is running up and running on the port ${CONFIG.port}`);
});
