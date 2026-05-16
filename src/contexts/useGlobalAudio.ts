import { useContext } from "react";
import { AudioContext } from "./audioContextState";

export function useGlobalAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useGlobalAudio must be used within AudioProvider");
  }
  return context;
}
