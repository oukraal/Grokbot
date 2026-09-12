import { useEffect } from "react";
import { useSpark } from "@/lib/spark/store";

export function SparkProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      useSpark.setState({ agentOpen: false });
    }
    const id = window.setInterval(() => {
      useSpark.getState().tick(Date.now());
    }, 400);
    useSpark.getState().tick(Date.now());
    return () => window.clearInterval(id);
  }, []);
  return children;
}