"use client";

import { useCallback, useState } from "react";
import { nanoid } from "nanoid";
import {
  Camera,
  canvasMode,
  CanvasState,
  LayerType,
  Point,
  Color,
} from "@/types/canvas";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import {
  useHistory,
  useCanUndo,
  useCanRedo,
  useMutation,
} from "@/liveblocks.config";
import { CursorsPresence } from "./cursors-presence";
import { pointerEventToCanvasPoint } from "@/lib/utils";
import { useStorage } from "@liveblocks/react";
import { LiveList, LiveObject } from "@liveblocks/client";
import { LayerPreview } from "./layer-preview";
//import { LayerPreview } from "./layer-preview";

const MAX_LAYERS = 100;

interface CanvasProps {
  boardId: string;
}

export const Canvas = ({ boardId }: CanvasProps) => {
  // 👇 Cast layerIds as LiveList<string> | null
  const layerIds = useStorage((root) => root.layerIds as LiveList<string> | null);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: canvasMode.None,
  });

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });

  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });

  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  // 👇 Insert new layers on canvas
  const insertLayer = useMutation(
    ({ storage, setMyPresence }, layerType: LayerType, position: Point) => {
      const liveLayers = storage.get("layers");
      const liveLayerIds = storage.get("layerIds");

      if (liveLayers.size >= MAX_LAYERS) return;

      const layerId = nanoid();

      const layer = new LiveObject({
        type: layerType,
        x: position.x,
        y: position.y,
        width: 100,
        height: 100,
        fill: lastUsedColor,
      });

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasState({ mode: canvasMode.None });
    },
    [lastUsedColor]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();
      const point = pointerEventToCanvasPoint(e, camera);
      setMyPresence({ cursor: point });
    },
    [camera]
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
  }, []);

  const onPointerUp = useMutation(
    ({}, e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera);

      console.log({
        point,
        mode: canvasState.mode,
      });

      if (
        canvasState.mode === canvasMode.Inserting &&
        "layerType" in canvasState
      ) {
        insertLayer(canvasState.layerType, point);
      } else {
        setCanvasState({ mode: canvasMode.None });
      }

      history.resume();
    },
    [camera, canvasState, history, insertLayer]
  );

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} />
      <Participants />
      <Toolbar
        CanvasState={canvasState}
        SetCanvasState={setCanvasState}
        canUndo={canUndo}
        canRedo={canRedo}
        undo={history.undo}
        redo={history.redo}
      />

      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
      >
        <g transform={`translate(${camera.x}, ${camera.y})`}>
          {layerIds?.map((layerId: string) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={() => {}}
              selectionColor="#000"
            />
          ))}
          <CursorsPresence />
        </g>
      </svg>
    </main>
  );
};
