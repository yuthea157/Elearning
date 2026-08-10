// The real "server-only" package throws unconditionally unless resolved
// under Next.js's "react-server" export condition — outside that (plain
// Vitest/Node), it would make every server-only module unimportable in
// tests. Aliased in here as a no-op via vitest.config.ts's resolve.alias.
export {};
