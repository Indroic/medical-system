import { useEffect, useState } from "react";
import { generateUrl } from "@imgproxy/imgproxy-js-core";

// Deben estar configuradas en Dokploy y en el frontend (.env)
const KEY = import.meta.env.VITE_IMGPROXY_KEY || "73757065722d7365637265742d6b6579";
const SALT = import.meta.env.VITE_IMGPROXY_SALT || "73757065722d7365637265742d73616c74";
// Mismo origen por defecto: el nginx de 'web' proxyea /imgproxy -> imgproxy.
const IMGPROXY_URL = import.meta.env.VITE_IMGPROXY_URL || "/imgproxy";
// Debe coincidir con S3_BUCKET del backend (config.py: s3_bucket). Si allí se
// cambia el bucket y aquí no, imgproxy resuelve una ruta inexistente y las
// imágenes dejan de cargar sin más pista que un 404.
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET || "medical-system";

async function signUrl(path: string): Promise<string> {
  if (!KEY || !SALT) {
    return `/insecure${path}`;
  }

  // hex to Uint8Array
  const hexToBuf = (hex: string) => {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return arr;
  };

  const keyBytes = hexToBuf(KEY);
  const saltBytes = hexToBuf(SALT);
  const pathBytes = new TextEncoder().encode(path);

  const data = new Uint8Array(saltBytes.length + pathBytes.length);
  data.set(saltBytes);
  data.set(pathBytes, saltBytes.length);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await window.crypto.subtle.sign("HMAC", cryptoKey, data);
  const signatureArr = Array.from(new Uint8Array(signatureBuffer));
  const sigBase64 = btoa(String.fromCharCode(...signatureArr))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `/${sigBase64}${path}`;
}

export function useImgproxyUrl(imagePath: string | null | undefined, width = 1000, height = 1000) {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    if (!imagePath) {
      setUrl("");
      return;
    }

    const path = generateUrl(
      { value: `s3://${S3_BUCKET}/${imagePath}`, type: "plain" },
      { resize: { resizing_type: "fit", width, height } }
    );

    signUrl(path).then((signedPath) => {
      setUrl(`${IMGPROXY_URL}${signedPath}`);
    }).catch((err) => {
      console.error("Error signing imgproxy url:", err);
      // Fallback
      setUrl(`${IMGPROXY_URL}/insecure${path}`);
    });
  }, [imagePath, width, height]);

  return url;
}
