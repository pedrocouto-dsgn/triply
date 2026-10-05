export type InlineState = { status: "idle" | "success" | "error"; message?: string };
export const initialInlineState: InlineState = { status: "idle" };
