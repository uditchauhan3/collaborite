import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

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
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
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

    // Modify the prompt to specifically request links
    const enhancedPrompt = `
      Please provide a detailed response to the following question/request. 
      Include relevant links to documentation, tutorials, or resources when applicable.
      Make sure to format links as complete URLs starting with http:// or https://.
      
      User's question/request: ${message}
    `;

    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from AI");
    }

    // Extract links from the response
    const { links, textWithoutLinks } = extractLinksFromText(text);

    console.log("Received response from Gemini:", text);
    console.log("Extracted links:", links);

    return NextResponse.json({ 
      response: textWithoutLinks.trim(),
      links: links 
    });
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