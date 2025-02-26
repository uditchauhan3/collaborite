"use client";

import Image from "next/image";
import { useOrganization } from "@clerk/nextjs";
import { ChevronsLeftRight } from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface ItemProps {
  id: string;
  name: string;
  imageUrl: string;
}

export const Item = ({
  id,
  name,
  imageUrl,
}: ItemProps) => {
  const { organization } = useOrganization();
  
  const isActive = organization?.id === id;

  return (
    <AccordionItem
      value={id}
      className="border-none"
    >
      <AccordionTrigger
        className={cn(
          "flex items-center gap-x-2 p-1.5 text-neutral-700 rounded-md hover:bg-neutral-500/10 transition text-start no-underline hover:no-underline",
          isActive && "bg-sky-500/10 text-sky-700"
        )}
      >
        <div className="flex items-center gap-x-2">
          <div className="w-7 h-7 relative">
            <Image
              fill
              src={imageUrl}
              alt="Organization"
              className="rounded-sm object-cover"
            />
          </div>
          <span className="font-medium text-sm">
            {name}
          </span>
        </div>
        <ChevronsLeftRight className="h-4 w-4 ml-auto shrink-0" />
      </AccordionTrigger>
      <AccordionContent className="pt-1 text-neutral-700">
        {/* Add your accordion content here */}
      </AccordionContent>
    </AccordionItem>
  );
};