"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useOthers } from "@/liveblocks.config";
import { ChatWindow } from "@/app/(dashboard)/_components/chat-window";
import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";

export const BoardChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const users = useOthers();
  const hasOtherUsers = users.length > 0;

  return (
    <>
      <Hint 
        label={hasOtherUsers ? "Chat with team members" : "No other members in the board"} 
        side="bottom" 
        sideOffset={10}
      >
        <Button 
          size="icon" 
          variant="board"
          onClick={() => hasOtherUsers && setIsChatOpen(!isChatOpen)}
          className={!hasOtherUsers ? "opacity-50 cursor-not-allowed" : ""}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      </Hint>
      
      {isChatOpen && <ChatWindow onClose={() => setIsChatOpen(false)} />}
    </>
  );
}; 