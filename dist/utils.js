"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunk = void 0;
function chunk(data, size) {
    const chunks = [];
    while (data.length) {
        chunks.push(data.splice(0, size));
    }
    return chunks;
}
exports.chunk = chunk;
