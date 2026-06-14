export type GoogleCredentialResponse = {
  credential: string;
};

type GoogleButtonOptions = {
  theme: 'outline' | 'filled_blue' | 'filled_black';
  size: 'large' | 'medium' | 'small';
  width: number;
  text: 'signin_with' | 'signup_with';
  shape: 'rectangular' | 'pill' | 'circle' | 'square';
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize(options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void | Promise<void>;
      }): void;
      renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
    };
  };
};

type WindowWithGoogle = Window & {
  google?: GoogleIdentity;
};

export function getGoogleIdentity() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  return (window as WindowWithGoogle).google;
}
