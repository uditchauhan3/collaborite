import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import dotenv from "dotenv";

dotenv.config();

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
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("Sending message to Gemini:", message);

    // Use the correct model name and version
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.0-pro",
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    // Generate response
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from AI");
    }

    console.log("Received response from Gemini:", text);

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request", 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
} 