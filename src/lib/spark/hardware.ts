export const SPARK = {
  product: "NVIDIA DGX Spark",
  chip: "GB10 Grace Blackwell Superchip",
  cpu: "20-core Arm (10× Cortex-X925 + 10× Cortex-A725)",
  gpu: "Blackwell, 5th-gen Tensor Cores, 4th-gen RT Cores",
  cudaCores: 6144,
  tensorPetaflopsFp4: 1,
  memoryGb: 128,
  memoryKind: "LPDDR5x coherent unified",
  memoryBandwidthGBs: 273,
  storageTb: 4,
  storageKind: "NVMe M.2 self-encrypting",
  os: "DGX OS 7 · Ubuntu 24.04",
  cuda: "CUDA 13.0",
  tdpW: 140,
  psuW: 240,
  osReservedGb: 8,
  comfortableHeadroomGb: 16,
} as const;

export function usableGb() {
  return SPARK.memoryGb - SPARK.osReservedGb;
}

export function fitLabel(sizeGb: number) {
  const used = SPARK.osReservedGb + sizeGb;
  if (sizeGb <= 0) return { id: "n/a" as const, label: "—", detail: "" };
  if (used + SPARK.comfortableHeadroomGb <= SPARK.memoryGb) {
    return {
      id: "easy" as const,
      label: "Easy fit",
      detail: `${sizeGb.toFixed(0)} GB weights · ~${(SPARK.memoryGb - used).toFixed(0)} GB left for KV`,
    };
  }
  if (used <= SPARK.memoryGb - 6) {
    return {
      id: "tight" as const,
      label: "Tight",
      detail: `${sizeGb.toFixed(0)} GB weights · keep context modest`,
    };
  }
  if (used <= SPARK.memoryGb) {
    return {
      id: "limit" as const,
      label: "At the limit",
      detail: "Will load; KV cache will be short",
    };
  }
  return {
    id: "cluster" as const,
    label: "Needs cluster",
    detail: "Two or four Sparks for this weight file",
  };
}
