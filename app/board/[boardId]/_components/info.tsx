"use client";
import Link from "next/link"
import Image from "next/image";
import { useQuery } from "convex/react";
import { Poppins } from "next/font/google";
import {Hint} from "@/components/hint"

import {cn} from "@/lib/utils"
import {Button} from "@/components/ui/button"
import { api } from "@/convex/_generated/api";
import { Actions } from "@/components/actions";
import { Id } from "@/convex/_generated/dataModel";
import { useRenameModel } from "@/store/use-rename-modal";
import { Menu } from "lucide-react";
import { BoardChatButton } from "./board-chat-button";

interface InfoProps{
    boardId:string;
}

const font = Poppins({
    subsets:["latin"],
    weight:["600"],
});

const TableSeprator = () => {
    return (
        <div className="text-slate-300 px-1.5 h-6">
            |
        </div>
    );
};

export const Info = ({
    boardId,
}:InfoProps) =>{
    const {onOpen}= useRenameModel();
    const data= useQuery(api.board.get,{
        id: boardId as Id<"boards">,
    })

    if(!data) return <InfoSkeleton/>;
    return (
        <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md">
            <Hint label="Go To Board" side="bottom" sideOffset={10}>
            <Button asChild variant="board" className="px-2">
                <Link href="/">
                <Image
                src="/logo.svg"
                alt="Board Logo"
                height={40}
                width={40}
                />
                <span className={cn("font-semibold text-xl ml-2 text-black",font.className,)}>
                    Board
                </span>
                </Link>
            </Button>
            </Hint>
            <TableSeprator/>
            <Hint label="Edit Title" side="bottom" sideOffset={10}>
            <Button
            variant="board"
            className="text-base font-normal px-2"
            onClick={()=> onOpen(data._id,data.title)}>
                {data.title}
            </Button>
            </Hint>
            <TableSeprator/>
            <BoardChatButton />
            <TableSeprator/>
            <Actions
            id={data._id}
            title={data.title}
            side="bottom"
            sideOffset={10}
            >
                <div>
                    <Hint label="Main menu" side="bottom" sideOffset={10}>
                        <Button size="icon" variant="board">
                            <Menu/>
                        </Button>
                    </Hint>
                </div>
                </Actions>
        </div>
    );
};

export const InfoSkeleton = function InfoSkeleton() {
    return (
        <div className="absolute top-2 left-2 bg-white rounded-md px-1.5 h-12 flex items-center shadow-md w-[300px]" />
       
    )
}