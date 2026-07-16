import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load shared environment files from the monorepo env directory.
dotenv.config({ path: path.resolve(__dirname, "../../../../env/root.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../../env/server.env") });

type JwtAlgorithm = "HS256" | "RS256";

const algorithm = (process.env.JWT_ALGORITHM || "HS256").toUpperCase() as JwtAlgorithm;

let privateKey: string | Buffer;
let publicKey: string | Buffer;

try {
  if (algorithm === "HS256") {
    const secret =
      process.env.JWT_SECRET?.replace(/\\n/g, "\n") ||
      process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, "\n") ||
      process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n");

    if (!secret) {
      throw new Error("JWT_SECRET or JWT_PRIVATE_KEY/JWT_PUBLIC_KEY must be set for HS256.");
    }

    privateKey = secret;
    publicKey = secret;
    console.log("JWT secret loaded for HS256.");
  } else {
    if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
      // Keys provided in env for RS256
      privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, "\n");
      publicKey = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, "\n");
      console.log("JWT keys loaded from environment variables.");
    } else {
      // Generate dynamic keys for development
      console.warn(
        "JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables not found.",
      );
      console.warn("Generating a temporary 2048-bit RSA key pair in memory...");
      const { privateKey: priv, publicKey: pub } = crypto.generateKeyPairSync(
        "rsa",
        {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: "spki",
            format: "pem",
          },
          privateKeyEncoding: {
            type: "pkcs8",
            format: "pem",
          },
        },
      );
      privateKey = priv;
      publicKey = pub;
      console.log("Temporary RSA key pair generated.");
    }
  }
} catch (error) {
  console.error("Error initializing JWT keys:", error);
  process.exit(1);
}

export const signAccessToken = (payload: object): string => {
  return jwt.sign(payload, privateKey, {
    algorithm,
    expiresIn: (process.env.JWT_ACCESS_EXPIRATION || "15m") as any,
  });
};

export const signRefreshToken = (payload: object): string => {
  return jwt.sign(payload, privateKey, {
    algorithm,
    expiresIn: (process.env.JWT_REFRESH_EXPIRATION || "7d") as any,
  });
};

export const verifyAccessToken = (token: string): any => {
  try {
    return jwt.verify(token, publicKey, { algorithms: [algorithm] });
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): any => {
  try {
    return jwt.verify(token, publicKey, { algorithms: [algorithm] });
  } catch (error) {
    return null;
  }
};
