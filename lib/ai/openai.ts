import OpenAI from "openai";

export async function askOpenAI(
  messages: { role: "user" | "assistant"; content: string }[],
  systemPrompt: string
) {
  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.OPENAI_API_KEY_1;

  if (!apiKey) {
    throw new Error("OpenAI API key is missing.");
  }

  const client = new OpenAI({
    apiKey,
  });

  const response = await client.responses.create({
    model: "gpt-5.5",
    instructions: systemPrompt,
    input: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });

  return response.output_text;
}