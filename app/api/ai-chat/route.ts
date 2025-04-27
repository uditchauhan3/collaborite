import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ✅ Import prisma to save AI responses

function extractLinksFromText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = text.match(urlRegex) || [];
  const textWithoutLinks = text.replace(urlRegex, '');
  return { links, textWithoutLinks };
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured");
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const { message, boardId, userId } = await req.json(); // ✅ also accept boardId and userId

    if (!message || !boardId || !userId) {
      return NextResponse.json(
        { error: "Message, boardId, and userId are required" },
        { status: 400 }
      );
    }

    console.log("Sending message to Gemini:", message);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(`
      Please provide a detailed response to the following question/request.
      Include relevant links if applicable.

      User's question/request: ${message}
    `);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from AI");
    }

    const { links, textWithoutLinks } = extractLinksFromText(text);

    console.log("Received response from Gemini:", text);
    console.log("Extracted links:", links);

    // ✅ Save AI's reply into database too
    await prisma.chat.create({
      data: {
        boardId,
        userId: "ai-assistant",
        message: textWithoutLinks.trim(),
        isAi: true,
      },
    });

    return NextResponse.json({
      response: textWithoutLinks.trim(),
      links: links,
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      return NextResponse.json(
        { error: "Failed to process request", details: error.message },
        { status: 500 }
      );
    } else {
      console.error("Unknown error", error);
      return NextResponse.json(
        { error: "Unknown server error" },
        { status: 500 }
      );
    }
  }
}
