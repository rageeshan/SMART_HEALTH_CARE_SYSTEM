import OpenAI from "openai";

let client = null;

/**
 * Returns a shared OpenAI client, or null if OPENAI_API_KEY is not set.
 * Lazy init avoids crashing the whole server at import time.
 */
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return null;
  }
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
};

export default getOpenAI;
