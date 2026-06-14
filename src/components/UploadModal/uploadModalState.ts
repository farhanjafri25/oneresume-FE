export type UploadActionState = {
  success?: boolean;
  error?: string;
  resumeId?: string;
  slug?: string;
} | null;

export function shouldProcessUploadSuccess(
  state: UploadActionState,
  processedState: UploadActionState,
): state is NonNullable<UploadActionState> & { success: true } {
  return Boolean(state?.success && state !== processedState);
}
