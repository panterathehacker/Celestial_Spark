export interface Point {
  x: number;
  y: number;
}

export interface Star extends Point {
  id: number;
  size: number;
  alpha: number;
  isSelected: boolean;
}

export interface ConstellationMetadata {
  name: string;
  horoscope: string;
  visualPrompt: string;
}

export enum AppPhase {
  INTRO = 'INTRO',
  SELECTING = 'SELECTING',
  CONNECTING = 'CONNECTING',
  GENERATING_METADATA = 'GENERATING_METADATA',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  RESULT = 'RESULT',
  EDITING = 'EDITING', // Phase where user waits for edit
}

export interface GeneratedAsset {
  imageBase64: string;
  metadata: ConstellationMetadata;
}
