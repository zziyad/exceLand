"use strickt";

const http = require("node:http");
const fs = require("node:fs");
const users = require("./routes/users.js");
const mongoose = require("mongoose");
require('dotenv').config();



mongoose
  .connect(process.env.MONGO)
  .then(() => console.log("Mongo DB is connected"))
  .catch((error) => console.log({ error }));


const routing = {
  "/api/user": async () => {
    return users();
  },
};

const types = {
  object: (o) => JSON.stringify(o),
  string: (s) => s,
  undefined: () => `requested URL ${url.join("?")} not found`,
  function: async (fn, req, res) => await fn(req, res),
};

const handleServerError = (res, err) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  res.end(
    JSON.stringify({
      success: false,
      statusCode,
      message,
    }),
  );
};

http
  .createServer(async (req, res) => {
    try {
      req.url.includes("?") ? (url = req.url.split("?")) : (url = [req.url]);
      const data = routing[url[0]];
      const type = typeof data;
      const serializer = types[type];
      let result = await serializer(data, req, res);
      const cType = {
        json: "application/json; charset=utf-8",
        html: "text/html; charset=utf-8",
      };
      const contentType = cType[url[1]] || cType["html"];

      res.writeHead(200, {
        "Content-Type": `${contentType}`,
      });
      result = JSON.stringify(result);
      res.end(result);
    } catch (error) {
      handleServerError(res, error);
    }
  })
  .listen(8080);
