const express = require("express");
const cors = require("cors");
const config = require("config");
const cookieParser = require("cookie-parser");

const indexRoute = require("./routes/router-index");

const port = config.get("port") || 8080;

console.log("dbHost: ", config.get("db.host"));

const app = express();

app.use(cors({ credentials: true, origin: config.get("client.url") }));
app.use(cookieParser(config.get("cookie.secret")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/", indexRoute);

app.listen(port, () => {
  console.log(
    `Server is alive on port: ${port} running as: ${process.env.NODE_ENV}`
  );
});

module.exports = app;
