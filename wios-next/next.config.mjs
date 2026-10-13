/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin must run as a normal Node package, not be bundled.
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
