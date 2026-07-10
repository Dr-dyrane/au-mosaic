/* Alias target for the Node-only ORT backend and sharp. The depth
   pipeline runs in a browser worker on WASM or WebGPU, so these never
   load; Turbopack points their browser resolution here instead of
   tracing into native binaries. */
export {};
