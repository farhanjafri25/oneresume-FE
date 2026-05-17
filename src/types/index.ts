export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Version {
  id: string;
  variantId: string;
  versionNumber: number;
  fileUrl: string;
  publicId: string;
  createdAt: string;
}

export interface Variant {
  id: string;
  resumeId: string;
  slug: string;
  isDefault: boolean;
  versions?: Version[];
}

export interface Resume {
  id: string;
  userId: string;
  slug: string;
  createdAt: string;
  variants?: Variant[];
}
