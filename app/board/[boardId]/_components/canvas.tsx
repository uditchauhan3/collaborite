"use client";


import { useState } from "react";
import { canvasMode,CanvasState } from "@/types/canvas";
import {Info} from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";



interface CanvasProps {
    boardId: string;
};

export const Canvas = ({
boardId,
}: CanvasProps) =>{
    const [CanvasState , SetCanvasState] =useState<CanvasState>({
        mode:CanvasMode
    });
    return (
        <main
        className="h-full w-full relative bg-neutral-100 touch-none"
        >
            <Info boardId={boardId}/>
            <Participants />
            <Toolbar />
        </main>
    );
};