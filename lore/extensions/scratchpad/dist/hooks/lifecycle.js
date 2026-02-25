export function setupLifecycle(httpServer, wsBridge) {
    const shutdown = () => {
        wsBridge.close();
        httpServer.close();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
//# sourceMappingURL=lifecycle.js.map