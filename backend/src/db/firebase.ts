import { initializeApp } from "firebase/app";
import { env } from "../config/env";

export const app = initializeApp(env.firebase);
