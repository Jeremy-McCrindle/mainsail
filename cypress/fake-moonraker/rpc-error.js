// An error a handler throws to send a JSON-RPC error response instead of a result.

export class RpcError extends Error {
    constructor(code, message) {
        super(message)
        this.code = code
    }

    toJson() {
        return { code: this.code, message: this.message }
    }
}
