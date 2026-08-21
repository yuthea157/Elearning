/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  images: {
    // Seed data uses these as stand-ins for real uploaded/CDN-hosted
    // course thumbnails and avatars — see docs/DATABASE.md "Seed data".
    // Swap for the real storage/CDN host once uploads are wired up.
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // The learning player embeds YouTube; a strict CSP without
          // frame-src/img-src for it would break every lesson video.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' https://picsum.photos https://i.pravatar.cc https://i.ytimg.com data:",
              "frame-src 'self' https://www.youtube.com",
              "connect-src 'self' https://api.stripe.com",
              "font-src 'self' data:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
