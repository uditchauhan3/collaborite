"use client";

import { useCallback, useMemo, useState,useEffect } from "react";
import { nanoid } from "nanoid";
import {
  Camera,
  canvasMode,
  CanvasState,
  LayerType,
  Point,
  Color,
  Side,
  XYWH,
  ArrowStyle,
  ArrowPoint,
  Layer,
  ArrowLayer,
  PathLayer,
} from "@/types/canvas";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { BoardChat } from "./board-chat";
import {
  useHistory,
  useCanUndo,
  useCanRedo,
  useMutation,
  useStorage,
  useOthersMapped,
  useSelf,
} from "@/liveblocks.config";
import { CursorsPresence } from "./cursors-presence";
import {
  colorsToCss,
     connectionIdToColor,
     findIntersectingLayersWithRectangle,
     penPointsToPathLayer,
     pointerEventToCanvasPoint,
     resizeBounds
     } from "@/lib/utils";
import { LiveObject } from "@liveblocks/client";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Path } from "./path";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { on } from "events";
import { ToolCursor } from "./tool-cursor";

const MAX_LAYERS = 100;

interface CanvasProps {
  boardId: string;
}

export const Canvas = ({ boardId }: CanvasProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const layerIds = useStorage((root) => root.layerIds);

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: canvasMode.None,
  });

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });

  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });

  const [clipboard, setClipboard] = useState<Layer[]>([]);

  const [cursorPosition, setCursorPosition] = useState<Point>({ x: 0, y: 0 });

  useDisableScrollBounce();
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const insertLayer = useMutation(
    ({ storage, setMyPresence }, layerType: LayerType.Ellipse | LayerType.Rectangle | LayerType.Text | LayerType.Note | LayerType.Arrow, position: Point
    ) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) {return};

      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();

      let layer: LiveObject<Layer>;
      if (layerType === LayerType.Arrow) {
        layer = new LiveObject<ArrowLayer>({
          type: layerType,
          x: position.x,
          y: position.y,
          width: 100,
          height: 100,
          points: [{
            x1: position.x,
            y1: position.y,
            x2: position.x + 100,
            y2: position.y
          }],
          fill: lastUsedColor,
          strokeWidth: 2,
          arrowStyle: ArrowStyle.Right
        });
      } else {
        layer = new LiveObject<Layer>({
          type: layerType,
          x: position.x,
          y: position.y,
          width: 100,
          height: 100,
          fill: lastUsedColor,
        });
      }

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasState({ mode: canvasMode.None });
    },
    [lastUsedColor]
  );

  const translateSelectedLayers = useMutation((
    { storage, self },
    point: Point,
  ) => {
    if (canvasState.mode !== canvasMode.Translating) {
      return;
    }

    const offset = {
      x: point.x - canvasState.current.x,
      y: point.y - canvasState.current.y,
    };

    const liveLayers = storage.get("layers");

    for (const id of self.presence.selection) {
      const layer = liveLayers.get(id);

      if (layer) {
        const layerType = layer.get("type");
        
        if (layerType === LayerType.Arrow) {
          const arrowLayer = layer as LiveObject<ArrowLayer>;
          const points = arrowLayer.get("points");
          if (Array.isArray(points) && points.length > 0) {
            const newPoints = [{
              x1: points[0].x1 + offset.x,
              y1: points[0].y1 + offset.y,
              x2: points[0].x2 + offset.x,
              y2: points[0].y2 + offset.y
            }];
            arrowLayer.set("points", newPoints);
            arrowLayer.update({
              x: arrowLayer.get("x") + offset.x,
              y: arrowLayer.get("y") + offset.y,
            });
          }
        } else {
          layer.update({
            x: layer.get("x") + offset.x,
            y: layer.get("y") + offset.y,
          });
        }
      }
    }

    setCanvasState({ mode: canvasMode.Translating, current: point });
  }, [canvasState]);

  const unSelectedLayers = useMutation((
    {self , setMyPresence}
  )=>{
    if(self.presence.selection.length>0)
    {
      setMyPresence({selection:[]}, {addToHistory: true});
    }
  },[]);

  const updateSelectionNet = useMutation((
    { storage, setMyPresence },
    current: Point,
    origin: Point,
  ) =>{
    const layers = storage.get("layers").toImmutable();
    setCanvasState({
      mode: canvasMode.SelectionNet,
      origin,
      current,
    });

    const ids = findIntersectingLayersWithRectangle(
      layerIds,
      layers,
      origin,
      current,
    );

    setMyPresence({ selection: ids });
  }, [layerIds]);

  const startMultiSelection = useCallback((
    current: Point,
    origin: Point,
  ) => {
    if (
      Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5
  ) {
    setCanvasState({
      mode: canvasMode.SelectionNet,
      origin,
      current,
    });
  }
  }, []);

  const continueDrawing = useMutation((
    { self, setMyPresence },
    point: Point,
    e: React.PointerEvent,
  ) => {
    const { pencilDraft } = self.presence;

    if(
      canvasState.mode !== canvasMode.Pencil ||
      e.buttons !== 1 ||
      pencilDraft == null
    ) {
      return;
    }

    setMyPresence({
      cursor: point,
      pencilDraft:
      pencilDraft.length === 1 &&
      pencilDraft[0][0] === point.x &&
      pencilDraft[0][1] === point.y
      ? pencilDraft
      : [...pencilDraft, [point.x, point.y, e.pressure]],
    });
  }, [canvasState.mode]);

  const insertPath = useMutation((
    { storage, self, setMyPresence }
  ) => {
    const liveLayers = storage.get("layers");
    const { pencilDraft } = self.presence;

    if(
      pencilDraft == null ||
      pencilDraft.length < 2 ||
      liveLayers.size >= MAX_LAYERS
    ) {
      setMyPresence({ pencilDraft: null });
      return;
    }

    const id = nanoid();
    liveLayers.set(
      id,
      new LiveObject(penPointsToPathLayer(
        pencilDraft,
        lastUsedColor,
      )),
    );

    const liveLayerIds = storage.get("layerIds");
    liveLayerIds.push(id);

    setMyPresence({ pencilDraft: null });
    setCanvasState({ mode: canvasMode.Pencil });

  }, [lastUsedColor]);

  const startDrawing = useMutation((
    { setMyPresence },
    point: Point,
    pressure: number,
  ) => {
    setMyPresence({
      pencilDraft: [[point.x, point.y, pressure]],
      penColor: lastUsedColor,
    })
  }, [lastUsedColor]);

  const resizeSelectedLayer = useMutation((
    {storage, self},
    point :Point,
  ) =>{
    if(canvasState.mode !== canvasMode.Resizing) {
      return;
    }
    const bounds = resizeBounds(
      canvasState.initialBounds,
      canvasState.corner,
      point,  
    );

    const liveLayers = storage.get("layers");
    const layer = liveLayers.get(self.presence.selection[0]);

    if(layer){
      layer.update(bounds);
    };
  },[canvasState])


   const onResizeHandlePointerDown = useCallback((
    corner : Side,
    initialBounds: XYWH,
   ) =>
  {
   history.pause();
   setCanvasState({
    mode:canvasMode.Resizing,
    initialBounds,
    corner,

   });
  },[history])

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerMove = useMutation(
    ({ setMyPresence, storage }, e: React.PointerEvent) => {
      e.preventDefault();

      const current = pointerEventToCanvasPoint(e, camera);
      setCursorPosition(current);

      if (canvasState.mode === canvasMode.Eraser) {
        // Erase layers when in eraser mode
        const liveLayers = storage.get("layers");
        const liveLayerIds = storage.get("layerIds");
        const layers = liveLayers.toImmutable();
        
        // Find layers that intersect with the current point
        const layerEntries = Array.from(layers.entries());
        layerEntries.forEach((entry) => {
          const [layerId, layer] = entry;
          
          if (layer.type === LayerType.Path) {
            // For Path layers, only delete points within erasure radius
            const pathLayer = layer as PathLayer;
            const points = pathLayer.points;
            
            // Calculate erasure radius based on pressure (if available) or use default
            const erasureRadius = e.pressure ? 10 + (e.pressure * 15) : 15;
            
            // Create a new array for points that will remain after erasure
            const remainingPoints: number[][] = [];
            let lastKeptPoint: number[] | null = null;
            
            for (let i = 0; i < points.length; i++) {
              const point = points[i];
              const [x, y, pressure] = point;
              const distance = Math.sqrt(
                Math.pow(x - current.x, 2) + Math.pow(y - current.y, 2)
              );
              
              if (distance >= erasureRadius) {
                // Point is outside erasure radius, keep it
                if (lastKeptPoint) {
                  // Add interpolated points between last kept point and current point
                  const [lastX, lastY, lastPressure] = lastKeptPoint;
                  const steps = Math.ceil(distance / 5); // Add points every 5 pixels
                  for (let j = 1; j < steps; j++) {
                    const t = j / steps;
                    const interpX = lastX + (x - lastX) * t;
                    const interpY = lastY + (y - lastY) * t;
                    const interpPressure = lastPressure + (pressure - lastPressure) * t;
                    const interpDistance = Math.sqrt(
                      Math.pow(interpX - current.x, 2) + Math.pow(interpY - current.y, 2)
                    );
                    if (interpDistance >= erasureRadius) {
                      remainingPoints.push([interpX, interpY, interpPressure]);
                    }
                  }
                }
                remainingPoints.push([x, y, pressure]);
                lastKeptPoint = [x, y, pressure];
              } else {
                // Point is inside erasure radius, skip it
                lastKeptPoint = null;
              }
            }
            
            if (remainingPoints.length === 0) {
              // If no points remain, delete the entire layer
              liveLayers.delete(layerId);
              const index = liveLayerIds.indexOf(layerId);
              if (index !== -1) {
                liveLayerIds.delete(index);
              }
            } else if (remainingPoints.length < points.length) {
              // Update the layer with remaining points
              const liveLayer = liveLayers.get(layerId) as LiveObject<PathLayer>;
              if (liveLayer) {
                liveLayer.set("points", remainingPoints);
              }
            }
          } else {
            // For other layer types, check if cursor is within layer bounds with some padding
            const padding = 15;
            const layerBounds = {
              x: layer.x - padding,
              y: layer.y - padding,
              width: layer.width + (padding * 2),
              height: layer.height + (padding * 2)
            };
            
            if (
              current.x >= layerBounds.x &&
              current.x <= layerBounds.x + layerBounds.width &&
              current.y >= layerBounds.y &&
              current.y <= layerBounds.y + layerBounds.height
            ) {
              // Delete the layer if cursor is within bounds
              liveLayers.delete(layerId);
              const index = liveLayerIds.indexOf(layerId);
              if (index !== -1) {
                liveLayerIds.delete(index);
              }
            }
          }
        });
        setMyPresence({ cursor: current });
        return;
      }

      if (canvasState.mode === canvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin);
      } else if (canvasState.mode === canvasMode.SelectionNet) {
        updateSelectionNet(current, canvasState.origin);
      } else if (canvasState.mode === canvasMode.Translating) {
        translateSelectedLayers(current);
      } else if (canvasState.mode === canvasMode.Resizing) {
        resizeSelectedLayer(current);
      } else if (canvasState.mode === canvasMode.Pencil) {
        continueDrawing(current, e);
      }

      setMyPresence({ cursor: current });
    },
    [
      continueDrawing,
      camera,
      canvasState,
      resizeSelectedLayer,
      translateSelectedLayers,
      startMultiSelection,
      updateSelectionNet,
    ]
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
  }, []);

  const onPointerDown = useMutation((
    { storage },
    e: React.PointerEvent,
  ) => {
    const point = pointerEventToCanvasPoint(e, camera);

    if (canvasState.mode === canvasMode.Inserting) {
      return;
    }

    if (canvasState.mode === canvasMode.Pencil) {
      startDrawing(point, e.pressure);
      return;
    }

    if (canvasState.mode === canvasMode.Eraser) {
      e.preventDefault(); // Prevent default selection behavior
      return;
    }

    setCanvasState({ origin: point, mode: canvasMode.Pressing });
  }, [camera, canvasState.mode, setCanvasState, startDrawing]);

  const onPointerUp = useMutation((
    {},
     e
    ) => {
      const point = pointerEventToCanvasPoint(e, camera);
  
      if (
        canvasState.mode === canvasMode.None ||
        canvasState.mode === canvasMode.Pressing
      ) {
        unSelectedLayers();
        setCanvasState({ mode: canvasMode.None, });
      }
        else if (canvasState.mode === canvasMode.Pencil){
          insertPath();
        }
       
       else if (
          canvasState.mode === canvasMode.Inserting) {
          insertLayer(canvasState.layerType, point);
        }
       else {
        setCanvasState({ mode: canvasMode.None });
      }
  
      history.resume();
    },
    [setCanvasState, camera, canvasState, history, insertLayer,unSelectedLayers, insertPath]
  );
  

  const selections = useOthersMapped((other) => other.presence.selection);

  const onLayerPointerDown = useMutation((
    { self, setMyPresence, storage },
    e: React.PointerEvent,
    layerId: string,
  ) => {
    if (
      canvasState.mode === canvasMode.Pencil ||
      canvasState.mode === canvasMode.Inserting ||
      canvasState.mode === canvasMode.Eraser
    ) {
      return;
    }

    history.pause();
    e.stopPropagation();

    const point = pointerEventToCanvasPoint(e, camera);

    if(!self.presence.selection.includes(layerId)) {
      setMyPresence({ selection: [layerId] }, { addToHistory: true });
    }
    
    const layer = storage.get("layers").get(layerId);
    if (layer) {
      setCanvasState({ mode: canvasMode.Translating, current: point });
    }
  },
  [
    setCanvasState,
    camera,
    history,
    canvasState.mode,
  ]);

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for(const user of selections) {
      const [connectionId, selection] = user;

      for(const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId)
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  const deleteLayers = useDeleteLayers();

  const copyLayers = useMutation(({ storage }) => {
    const selectedLayers = selections;
    if (selectedLayers.length === 0) return;

    const layers = selectedLayers.map(([_, selection]) => {
      const layer = storage.get("layers").get(selection[0]);
      if (!layer) return null;
      return { ...layer.toObject() };
    }).filter(Boolean) as Layer[];

    setClipboard(layers);
  }, [selections]);

  const pasteLayers = useMutation(({ storage, setMyPresence }) => {
    if (clipboard.length === 0) return;

    const newLayers: Layer[] = clipboard.map(layer => ({
      ...layer,
      x: layer.x + 20, // Offset pasted layers slightly
      y: layer.y + 20,
    }));

    const newLayerIds = newLayers.map(() => nanoid());
    
    // Add new layers to the canvas
    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");
    
    newLayers.forEach((layer, index) => {
      const layerId = newLayerIds[index];
      liveLayers.set(layerId, new LiveObject(layer));
      liveLayerIds.push(layerId);
    });

    // Update selection to the new layers
    setMyPresence({ selection: newLayerIds });
  }, [clipboard]);

  useEffect(()=>{
    function onKeyDown(e: KeyboardEvent){
      switch (e.key){
        // case "Backspace":
        //   deleteLayers();
        //   break;
        case "z" : {
          if(e.ctrlKey || e.metaKey){
            if(e.shiftKey){
              history.redo();
            }
            else{
              history.undo();
            }
            break;
          }
        }
        
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  },[deleteLayers, history])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
        copyLayers();
      }
      if (e.key === "v" && (e.metaKey || e.ctrlKey)) {
        pasteLayers();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copyLayers, pasteLayers]);

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

      <SelectionTools
      camera ={camera}
      setLastUsedColor={setLastUsedColor}

      />

      {isChatOpen && <BoardChat onClose={() => setIsChatOpen(false)} />}
      <button
        onClick={() => setIsChatOpen(true)}
        className="absolute bottom-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <g
        style={{ transform: `translate(${camera.x}px, ${camera.y}px)`
        }}
        >
          {layerIds?.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}
          <SelectionBox
            onResizeHandlePointerDown= {onResizeHandlePointerDown}
          />
          {canvasState.mode === canvasMode.SelectionNet && canvasState.current != null && (
            <rect  
            className="fill-blue-500/5 stroke-blue-500 stroke-1"
            x={Math.min(canvasState.origin.x, canvasState.current.x)}
            y={Math.min(canvasState.origin.y, canvasState.current.y)}
            width = {Math.abs(canvasState.origin.x- canvasState.current.x)}
            height = {Math.abs(canvasState.origin.y- canvasState.current.y)}
            />
          )}
          <CursorsPresence />

          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorsToCss(lastUsedColor)}
              x={0}
              y={0}
              />
          )}
          <ToolCursor
            mode={canvasState.mode}
            layerType={canvasState.mode === canvasMode.Inserting ? canvasState.layerType : undefined}
            x={cursorPosition.x}
            y={cursorPosition.y}
          />
        </g>
      </svg>
    </main>
  );
};
