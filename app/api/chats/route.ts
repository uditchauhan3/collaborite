import { prisma } from "@/lib/prisma";

// POST /api/chats - Save a new chat message
export async function POST(req: Request) {
  const { boardId, userId, message, isAi } = await req.json();

  const chat = await prisma.chat.create({
    data: {
      boardId,
      userId,
      message,
      isAi,
    },
  });

  return Response.json(chat);
}

// GET /api/chats?boardId=... - Get all chats for a board
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const boardId = searchParams.get("boardId");

  if (!boardId) {
    return new Response("Board ID missing", { status: 400 });
  }

  const chats = await prisma.chat.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(chats);
}
