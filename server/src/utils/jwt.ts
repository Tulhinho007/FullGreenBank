import jwt from 'jsonwebtoken';

const JWT_SECRET         = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh') as string;
const JWT_EXPIRES_IN     = '15m';   // Access token curto — 15 minutos
const JWT_REFRESH_EXPIRES_IN = '7d'; // Refresh token longo — 7 dias

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
};