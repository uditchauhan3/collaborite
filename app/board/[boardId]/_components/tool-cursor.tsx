"use client";

import { memo } from "react";
import { 
  MousePointer2, 
  Pencil, 
  Eraser, 
  ArrowRight, 
  Type, 
  StickyNote, 
  Square, 
  Circle 
} from "lucide-react";
import { canvasMode, LayerType } from "@/types/canvas";

interface ToolCursorProps {
  mode: canvasMode;
  layerType?: LayerType;
  x: number;
  y: number;
}

export const ToolCursor = memo(({ mode, layerType, x, y }: ToolCursorProps) => {
  if (mode === canvasMode.None) {
    return null;
  }

  const getCursorIcon = () => {
    switch (mode) {
      case canvasMode.Pencil:
        return <Pencil className="h-6 w-6" />;
      case canvasMode.Eraser:
        return <Eraser className="h-6 w-6" />;
      case canvasMode.Inserting:
        switch (layerType) {
          case LayerType.Arrow:
            return <ArrowRight className="h-6 w-6" />;
          case LayerType.Text:
            return <Type className="h-6 w-6" />;
          case LayerType.Note:
            return <StickyNote className="h-6 w-6" />;
          case LayerType.Rectangle:
            return <Square className="h-6 w-6" />;
          case LayerType.Ellipse:
            return <Circle className="h-6 w-6" />;
          default:
            return <MousePointer2 className="h-6 w-6" />;
        }
      default:
        return <MousePointer2 className="h-6 w-6" />;
    }
  };

  return (
    <foreignObject
      x={x}
      y={y}
      width={24}
      height={24}
      className="pointer-events-none"
      style={{
        transform: "translate(-12px, -12px)",
      }}
    >
      <div className="flex items-center justify-center">
        {getCursorIcon()}
      </div>
    </foreignObject>
  );
});

ToolCursor.displayName = "ToolCursor"; 