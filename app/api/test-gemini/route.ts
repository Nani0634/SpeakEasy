import { NextResponse } from "next/server";
import { askGemini } from "@/lib/ai/gemini";

export async function GET() {
  try {
    const reply = await askGemini(
      [
        {
          role: "user",
          content: "Say hello to me in one short sentence.",
        },
      ],
      "You are a friendly English speaking partner."
    );

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Gemini test error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}