import { createContext } from "react";
import type { RadioMetadata } from "../services/radioMetadata.service";

export type AudioContextType = {
  playing: boolean;
  error: string;
  togglePlayback: () => Promise<void>;
  volume: number;
  setVolume: (volume: number) => void;
  programTitle: string;
  announcer: string;
  frequency: string;
  streamUrl: string;
  metadata: RadioMetadata;
  refreshMetadata: () => Promise<void>;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
};

export const AudioContext = createContext<AudioContextType | null>(null);
