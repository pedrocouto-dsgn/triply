export type StopImageState = { status: "idle" | "error"; message?: string };
export const initialStopImageState: StopImageState = { status: "idle" };
export const MAX_STOP_IMAGE_BYTES = 5 * 1024 * 1024;
export const STOP_IMAGE_HINT = "Recomendado: 1920 × 1080 px (formato horizontal 16:9) · JPG, PNG ou WEBP · até 5 MB.";
