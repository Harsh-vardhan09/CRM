import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

let privateKey: string | Buffer;
let publicKey: string | Buffer;

try {
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
    // Keys provided in env
    privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
    publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
    console.log('JWT keys loaded from environment variables.');
  } else {
    // Generate dynamic keys for development
    console.warn('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables not found.');
    console.warn('Generating a temporary 2048-bit RSA key pair in memory...');
    const { privateKey: priv, publicKey: pub } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });
    privateKey = priv;
    publicKey = pub;
    console.log('Temporary RSA key pair generated.');
  }
} catch (error) {
  console.error('Error initializing JWT keys:', error);
  process.exit(1);
}

export const signAccessToken = (payload: object): string => {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as any,
  });
};

export const signRefreshToken = (payload: object): string => {
  return jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as any,
  });
};

export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, publicKey, { algorithms: ['RS256'] });
  } catch (error) {
    return null;
  }
};
