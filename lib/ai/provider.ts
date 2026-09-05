import { askOpenAI } from "./openai";
import {
  askGemini,
  streamGemini,
  type ChatMessage,
} from "./gemini";

export type AIProvider = "openai" | "gemini";

export async function askAI(
  provider: AIProvider,
  messages: ChatMessage[],
  systemPrompt: string
) {
  switch (provider) {
    case "openai":
      return await askOpenAI(
        messages,
        systemPrompt
      );

    case "gemini":
      return await askGemini(
        messages,
        systemPrompt
      );

    default:
      throw new Error(
        `Unsupported AI provider: ${provider}`
      );
  }
}

export async function streamAI(
  provider: AIProvider,
  messages: ChatMessage[],
  systemPrompt: string
) {
  switch (provider) {
    case "gemini":
      return await streamGemini(
        messages,
        systemPrompt
      );

    case "openai":
      throw new Error(
        "OpenAI streaming is not enabled yet."
      );

    default:
      throw new Error(
        `Unsupported AI provider: ${provider}`
      );
  }
}