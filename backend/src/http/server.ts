import express from "express";
import { env } from "../config/env";
import { router } from "./router";

const app = express();

app.use(express.json());
app.use(router);

app.listen(env.port, () => {
  console.log(`Server running on port ${env.port}`);
});
