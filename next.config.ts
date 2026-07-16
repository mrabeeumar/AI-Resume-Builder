import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse's package.json lists a "browser" export condition before
  // "node"/"import"/"require". Bundling it into the server chunk lets that
  // condition win, pulling in pdfjs-dist's web build (which references the
  // browser-only DOMMatrix global) and crashing every SSR page that
  // transitively imports lib/parsing/document-extraction.ts. Marking it
  // external forces Node's own module resolution at runtime instead, which
  // correctly picks the Node build.
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;
