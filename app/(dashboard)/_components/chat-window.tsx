"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Draggable from "react-draggable";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation"; // ✅ Import useParams

interface Message {
  id: string;
  content: string;
  userId: string;
  username: string;
  createdAt: number;
}

interface ChatWindowProps {
  onClose: () => void;
}

export const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useUser();
  const params = useParams(); // ✅ Get boardId from URL
  const boardId = params.boardId as string; // ✅ extract boardId
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!boardId) return; // ✅ if no boardId, don't fetch

    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chats?boardId=${boardId}`);
        const data = await res.json();

        const formatted = data.map((chat: any) => ({
          id: chat.id,
          content: chat.message,
          userId: chat.userId,
          username: chat.userId === "ai-assistant" ? "AI Assistant" : "User",
          createdAt: new Date(chat.createdAt).getTime(),
        }));

        setMessages(formatted);
      } catch (error) {
        console.error("Failed to load chats", error);
      }
    };

    fetchMessages();
  }, [boardId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !boardId) return;

    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          userId: user.id,
          message: newMessage.trim(),
          isAi: false,
        }),
      });

      const newChat = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: newChat.id,
          content: newChat.message,
          userId: newChat.userId,
          username: user.firstName || "Anonymous",
          createdAt: new Date(newChat.createdAt).getTime(),
        },
      ]);

      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <Draggable handle=".handle">
      <div className="fixed bottom-20 right-20 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col border">
        {/* Header */}
        <div className="handle cursor-move p-3 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
          <h3 className="font-semibold text-gray-700">Team Chat</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.userId === user?.id ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-2 ${
                  message.userId === user?.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100"
                }`}
              >
                <p className="text-xs font-semibold mb-1">{message.username}</p>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </Draggable>
  );
};
