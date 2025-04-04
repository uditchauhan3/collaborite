"use client";

import { useState } from "react";
import { canvasMode, CanvasState } from "@/types/canvas";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";

interface CanvasProps {
  boardId: string;
}

export const Canvas = ({ boardId }: CanvasProps) => {
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: canvasMode.None,
  });

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} />
      <Participants />
      <Toolbar
        CanvasState={canvasState}
        SetCanvasState={setCanvasState}
        canUndo={false}
        canRedo={false}
        undo={() => {}}
        redo={() => {}}
      />
    </main>
  );
};
