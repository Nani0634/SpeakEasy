import { NextResponse } from "next/server";
import {
  askAI,
  streamAI,
  type AIProvider,
} from "@/lib/ai/provider";

const systemPrompt = `
You are SpeakEasy AI, a friendly English-speaking
practice partner and English tutor.

The user is practicing spoken English.

Your job is to have a natural conversation while
helping the learner improve their English.

IMPORTANT RESPONSE FORMAT:

If the user's latest English is correct or does not
have an important mistake, respond naturally.

If the user makes an important grammar, vocabulary,
or sentence-structure mistake, use this format:

Conversation:
[Your natural response to what the user said]

Correction:
❌ [The user's incorrect sentence]

✅ [The corrected sentence]

Tip:
[One short and simple explanation]

If there is no important mistake, DO NOT include a
Correction section.

Rules:
- Keep the conversation natural.
- Use clear English suitable for learners.
- Keep responses short.
- Correct important mistakes, not every tiny mistake.
- Be encouraging and friendly.
- Ask a natural follow-up question when appropriate.
- Never embarrass or criticize the learner.
- Do not give long grammar lessons.
- Focus on helping the user communicate confidently.
`;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const messages = body.messages;

    const provider: AIProvider =
      body.provider || "gemini";

    if (
      !Array.isArray(messages) ||
      messages.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Messages are required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Gemini streaming
     */
    if (provider === "gemini") {
      const stream = await streamAI(
        provider,
        messages,
        systemPrompt
      );

      const encoder = new TextEncoder();

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (
                event.event_type === "step.delta" &&
                event.delta?.type === "text"
              ) {
                const text = event.delta.text;

                if (text) {
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        text,
                      })}\n\n`
                    )
                  );
                }
              }
            }

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  done: true,
                })}\n\n`
              )
            );

            controller.close();
          } catch (error) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  error:
                    error instanceof Error
                      ? error.message
                      : "Streaming failed.",
                })}\n\n`
              )
            );

            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type":
            "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    /*
     * OpenAI fallback
     */
    const reply = await askAI(
      provider,
      messages,
      systemPrompt
    );

    return NextResponse.json({
      reply,
      provider,
    });
  } catch (error) {
    console.error("AI API error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to get an AI response.",
      },
      {
        status: 500,
      }
    );
  }
}