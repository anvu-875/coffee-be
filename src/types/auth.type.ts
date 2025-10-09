export interface AccessTokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  jti: string;
  type: 'refresh';
}

export interface SessionData {
  userId: string; // added userId to session data
  publicKey: string; // pem format
  jtiDigest: string; // sha256 hex
  lastUsed?: string; // timestamp ms as string
}
