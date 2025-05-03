import {
  Circle,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  StickyNote,
  Type,
  Undo2,
  ArrowRight,
  Eraser,
} from "lucide-react";
import { ToolButton } from "./tool-button";

import { canvasMode, CanvasState, LayerType } from "@/types/canvas";

interface ToolBarProps {
  CanvasState: CanvasState;
  SetCanvasState: (newState: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const Toolbar = ({
  CanvasState,
  SetCanvasState,
  undo,
  redo,
  canUndo,
  canRedo,
}: ToolBarProps) => {
  return (
    <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4">
      <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
        <ToolButton
          label="Select"
          icon={MousePointer2}
          onClick={() => SetCanvasState({ mode: canvasMode.None })}
          isActive={
            CanvasState.mode === canvasMode.None ||
            CanvasState.mode === canvasMode.Translating ||
            CanvasState.mode === canvasMode.SelectionNet ||
            CanvasState.mode === canvasMode.Pressing ||
            CanvasState.mode === canvasMode.Resizing
          }
        />
        <ToolButton
          label="Text"
          icon={Type}
          onClick={() =>
            SetCanvasState({
              mode: canvasMode.Inserting,
              layerType: LayerType.Text,
            })
          }
          isActive={
            CanvasState.mode === canvasMode.Inserting &&
            CanvasState.layerType === LayerType.Text
          }
        />
        <ToolButton
          label="Sticky Note"
          icon={StickyNote}
          onClick={() =>
            SetCanvasState({
              mode: canvasMode.Inserting,
              layerType: LayerType.Note,
            })
          }
          isActive={
            CanvasState.mode === canvasMode.Inserting &&
            CanvasState.layerType === LayerType.Note
          }
        />
        <ToolButton
          label="Rectangle"
          icon={Square}
          onClick={() =>
            SetCanvasState({
              mode: canvasMode.Inserting,
              layerType: LayerType.Rectangle,
            })
          }
          isActive={
            CanvasState.mode === canvasMode.Inserting &&
            CanvasState.layerType === LayerType.Rectangle
          }
        />
        <ToolButton
          label="Ellipse"
          icon={Circle}
          onClick={() =>
            SetCanvasState({
              mode: canvasMode.Inserting,
              layerType: LayerType.Ellipse,
            })
          }
          isActive={
            CanvasState.mode === canvasMode.Inserting &&
            CanvasState.layerType === LayerType.Ellipse
          }
        />
        <ToolButton
          label="Arrow"
          icon={ArrowRight}
          onClick={() =>
            SetCanvasState({
              mode: canvasMode.Inserting,
              layerType: LayerType.Arrow,
            })
          }
          isActive={
            CanvasState.mode === canvasMode.Inserting &&
            CanvasState.layerType === LayerType.Arrow
          }
        />
        <ToolButton
          label="Pen"
          icon={Pencil}
          onClick={() => SetCanvasState({ mode: canvasMode.Pencil })}
          isActive={CanvasState.mode === canvasMode.Pencil}
        />
        <ToolButton
          label="Eraser"
          icon={Eraser}
          onClick={() => SetCanvasState({ mode: canvasMode.Eraser })}
          isActive={CanvasState.mode === canvasMode.Eraser}
        />
      </div>

      <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
        <ToolButton
          label="Undo"
          icon={Undo2}
          onClick={undo}
          isDisabled={!canUndo}
        />
        <ToolButton
          label="Redo"
          icon={Redo2}
          onClick={redo}
          isDisabled={!canRedo}
        />
      </div>
    </div>
  );
};

export const ToolbarSkeleton = () => {
  return (
    <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 bg-white h-[360px] w-[52px] shadow-md rounded-md" />
  );
};
