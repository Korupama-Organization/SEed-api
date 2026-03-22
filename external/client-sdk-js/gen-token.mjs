// Quick LiveKit token generator for local dev
// Usage: node gen-token.mjs [room] [identity]
import { createHmac } from 'crypto';

const API_KEY = 'devkey';
const API_SECRET = 'secret';
const room = process.argv[2] || 'my-room';
const identity = process.argv[3] || 'user1';

// Build JWT manually (no deps needed)
function base64url(obj) {
    return Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

const header = base64url({ alg: 'HS256', typ: 'JWT' });
const now = Math.floor(Date.now() / 1000);
const payload = base64url({
    iss: API_KEY,
    sub: identity,
    iat: now,
    exp: now + 3600,
    video: {
        roomJoin: true,
        room,
        canPublish: true,
        canSubscribe: true,
    },
});

const sig = createHmac('sha256', API_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

const token = `${header}.${payload}.${sig}`;

console.log('\n=== LiveKit Local Dev Token ===');
console.log(`Room:     ${room}`);
console.log(`Identity: ${identity}`);
console.log(`URL:      ws://localhost:7880`);
console.log(`\nToken:\n${token}\n`);
