"use client";

import { UserButton, OrganizationSwitcher, useOrganization } from "@clerk/nextjs";
import { SearchInput } from "./search-input";
import { InviteButton } from "./invite-button";
import { Bot } from "lucide-react";
import { useState } from "react";
import { AIChatWindow } from "./ai-chat-window";

export const Navbar = () => {
  const organization = useOrganization();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  return (
    <div className="flex items-center p-5">
      
      <div className="hidden lg:flex flex-1">
        <SearchInput />
      </div>

      <div className="lg:ml-auto flex items-center gap-x-2">
        {organization && (
          <>
            <button
              onClick={() => setIsAIChatOpen(!isAIChatOpen)}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="AI Assistant"
            >
              <Bot className="h-5 w-5 text-gray-500" />
            </button>
            
            <InviteButton />
          </>
        )}
        <UserButton />
      </div>

      {isAIChatOpen && <AIChatWindow onClose={() => setIsAIChatOpen(false)} />}
    </div>
  );
};
    