"use client";

import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import config from "../aws-exports.js";

Amplify.configure(outputs, { ssr: true });

export default function ConfigureAmplify() {
  return null;
}
