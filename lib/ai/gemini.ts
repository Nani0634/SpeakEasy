import { GoogleGenAI } from "@google/genai";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function buildConversation(messages: ChatMessage[]) {
  return messages
    .map((message) => {
      const speaker =
        message.role === "user" ? "User" : "Assistant";

      return `${speaker}: ${message.content}`;
    })
    .join("\n\n");
}

export async function askGemini(
  messages: ChatMessage[],
  systemPrompt: string
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is missing.");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const conversation = buildConversation(messages);

  const interaction = await ai.interactions.create({
    model: "gemini-3.6-flash",
    input: conversation,
    system_instruction: systemPrompt,
  });

  return interaction.output_text;
}

export async function streamGemini(
  messages: ChatMessage[],
  systemPrompt: string
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is missing.");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  const conversation = buildConversation(messages);

  const stream = await ai.interactions.create({
    model: "gemini-3.6-flash",
    input: conversation,
    system_instruction: systemPrompt,
    stream: true,
  });

  return stream;
}