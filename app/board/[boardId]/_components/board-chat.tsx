"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import Draggable from "react-draggable";
import { useSelf, useOthers, useBroadcastEvent, useStorage } from "@/liveblocks.config";
import { LiveList } from "@liveblocks/client";

interface Message {
  id: string;
  content: string;
  userId: string;
  username: string;
  createdAt: number;
}

interface BoardChatProps {
  onClose: () => void;
}

export const BoardChat = ({ onClose }: BoardChatProps) => {
  const [newMessage, setNewMessage] = useState("");
  const currentUser = useSelf();
  const others = useOthers();
  const broadcast = useBroadcastEvent();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const storage = useStorage();

  // Initialize messages storage if it doesn't exist
  useEffect(() => {
    if (!storage.get("messages")) {
      storage.set("messages", new LiveList<Message>());
    }
  }, [storage]);

  const messages = storage?.get("messages") || [];

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for new messages from other users
  useEffect(() => {
    const handleMessage = (event: { type: string; message: Message }) => {
      if (event.type === "CHAT_MESSAGE") {
        const currentMessages = storage.get("messages");
        if (currentMessages) {
          currentMessages.push(event.message);
        }
      }
    };

    // Subscribe to broadcast events
    const unsubscribe = broadcast.subscribe(handleMessage);
    return () => unsubscribe();
  }, [broadcast, storage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    // Create new message
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage.trim(),
      userId: currentUser.connectionId.toString(),
      username: currentUser.info?.name || "You",
      createdAt: Date.now(),
    };

    // Add message to storage
    const currentMessages = storage.get("messages");
    if (currentMessages) {
      currentMessages.push(message);
    }

    setNewMessage("");

    // Broadcast message to other users
    broadcast({
      type: "CHAT_MESSAGE",
      message,
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Draggable handle=".handle">
      <div className="fixed bottom-20 right-20 w-80 h-96 bg-white rounded-lg shadow-xl flex flex-col border">
        {/* Header - Draggable handle */}
        <div className="handle cursor-move p-3 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
          <h3 className="font-semibold text-gray-700">Board Chat</h3>
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
                message.userId === currentUser.connectionId.toString()
                  ? "items-end"
                  : "items-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-2 ${
                  message.userId === currentUser.connectionId.toString()
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