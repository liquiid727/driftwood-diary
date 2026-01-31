export type ThemeId = "forest" | "graduation" | "springFestival" | (string & {});

export type SizePreset = "A4" | "9:16" | "1:1";

export interface Room {
  id: string;
  name: string;
  themeId: ThemeId;
  pages: Page[];
  coverPageId?: string;
  coverDecorations?: Decoration[];
  tagStyle?: {
    includeWatermark: boolean;
    includePageTag: boolean;
    includeThemeTag: boolean;
    watermarkText: string;
    pageTagPosition: "bl" | "br" | "tl" | "tr";
    pageTagTone: "light" | "dark";
    pageTagFont: "sans" | "serif" | "mono";
    pageTagSize: number;
    pageTagOpacity: number;
    pageTagPadding: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface Page {
  id: string;
  name?: string;
  sizePreset: SizePreset;
  layoutId: string;
  cellStates: Record<string, CellState>;
  decorations: Decoration[];
  background: Background;
  filter?: PageFilter;
  regionImages?: Record<string, string>;
  regionTransforms?: Record<
    string,
    { scale: number; offsetX: number; offsetY: number; rotate: number }
  >;
  thumbnail?: string;
}

export interface Layout {
  id: string;
  name: string;
  cols: number;
  rows: number;
  regions: Region[];
}

export interface Region {
  id: string;
  order: number;
  cells: Array<[number, number]>;
}

export interface CellState {
  regionId: string;
  assetId?: string;
  fitMode: "cover" | "contain";
  pan: { x: number; y: number };
  zoom: number;
  rotate: 0 | 90 | 180 | 270;
}

export interface Asset {
  id: string;
  name: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  storageKey: string;
}

export interface Decoration {
  id: string;
  type: "text" | "sticker" | "shape";
  transform: { x: number; y: number; scaleX: number; scaleY: number; rotation: number };
  style: Record<string, unknown>;
  zIndex: number;
}

export type Background =
  | { type: "color"; value: string }
  | { type: "gradient"; value: string }
  | { type: "image"; value: string };

export type PageFilter = "none" | "warm" | "gray" | "contrast";
