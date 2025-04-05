// Color type used for layer fill
export type Color = {
  r: number;
  g: number;
  b: number;
};

// Camera position on canvas
export type Camera = {
  x: number;
  y: number;
};

// Supported layer types
export enum LayerType {
  Rectangle = "rectangle",
  Ellipse = "ellipse",
  Path = "path",
  Text = "text",
  Note = "note",
}

// Shared fields for all layers
export type BaseLayer = {
  x: number;
  y: number;
  width: number;
  height: number;
  fill: Color;
  value?: string;
};

// Layer type definitions
export type RectangleLayer = BaseLayer & {
  type: LayerType.Rectangle;
};

export type EllipseLayer = BaseLayer & {
  type: LayerType.Ellipse;
};

export type PathLayer = BaseLayer & {
  type: LayerType.Path;
  points: number[][]; // x, y coordinate pairs
};

export type TextLayer = BaseLayer & {
  type: LayerType.Text;
};

export type NoteLayer = BaseLayer & {
  type: LayerType.Note;
};

// Union of all layers
export type Layer =
  | RectangleLayer
  | EllipseLayer
  | PathLayer
  | TextLayer
  | NoteLayer;

// Basic point (x, y)
export type Point = {
  x: number;
  y: number;
};

// Rectangle geometry
export type XYWH = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Enum for resizing directions
export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

// Canvas interaction modes
export enum canvasMode {
  None = "none",
  Pressing = "pressing",
  Translating = "translating",
  Inserting = "inserting",
  Resizing = "resizing",
  Pencil = "pencil",
  SelectionNet = "selectionNet",
}

// Canvas interaction state
export type CanvasState =
  | {
      mode: canvasMode.None;
    }
  | {
      mode: canvasMode.SelectionNet;
      origin: Point;
      current?: Point;
    }
  | {
      mode: canvasMode.Translating;
      current: Point;
    }
  | {
      mode: canvasMode.Inserting;
      layerType: LayerType.Ellipse | LayerType.Rectangle | LayerType.Text | LayerType.Note;
    }
  | {
      mode: canvasMode.Pencil;
    }
  | {
      mode: canvasMode.Pressing;
      origin: Point;
    }
  | {
      mode: canvasMode.Resizing;
      initialBounds: XYWH;
      corner: Side;
    };
