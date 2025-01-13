import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// if (process.env.NEXT_PUBLIC_TEMPO) {
//   nextConfig["experimental"] = {
//     swcPlugins: [[require.resolve("tempo-devtools/swc/0.86"), {}]],
//   };
// }

export default nextConfig;
