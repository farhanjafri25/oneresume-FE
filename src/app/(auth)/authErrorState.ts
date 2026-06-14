export type AuthErrorStateInput = {
  formError?: string | null;
  googleError?: string | null;
};

export function getAuthErrorState({ formError, googleError }: AuthErrorStateInput) {
  return {
    alertError: formError || googleError || null,
    credentialFieldsInvalid: Boolean(formError),
  };
}
