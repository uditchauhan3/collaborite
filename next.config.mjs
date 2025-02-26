import { hostname } from 'os';

/** @type {import('next').NextConfig} */
const nextConfig = {
    images:{
        remotePatterns:[
            {
                protocol:"https",
                hostname:"img.clerk.com"
            }
        ]
    },
    env: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    },
};

export default nextConfig;
