"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Draggable from "react-draggable";
import { useUser } from "@clerk/nextjs";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Add new message
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      userId: user.id,
      username: user.firstName || "Anonymous",
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  return (
    <Draggable handle=".handle">
      <div className="fixed bottom-20 right-20 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col border">
        {/* Header - Draggable handle */}
        <div className="handle cursor-move p-3 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
          <h3 className="font-semibold text-gray-700">Team Chat</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded-full transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages area */}
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

        {/* Message input */}
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