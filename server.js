
const http = require("http");

const { PORT } = require("./config/railway");

const { handleHttpRequest } =
    require("./routes/httpRoutes");

const { loadServerInfo } =
    require("./services/metadataService");

const { startSimulation } =
    require("./services/railwayService");

const { initializeRailwaySocket } =
    require("./websocket/railwaySocket");

const server = http.createServer(handleHttpRequest);

const railwaySocket = initializeRailwaySocket(server);

let simulationTimer;

server.listen(PORT, async () => {
    console.log(
        `Railway server listening on port ${PORT}`
    );

    // Load AWS information without blocking the server startup.
    await loadServerInfo();

    // Start the simulation and broadcast each update.
    simulationTimer = startSimulation(update => {
        railwaySocket.broadcastUpdate(update);
    });
});

// Graceful shutdown
function shutdown(signal) {
    console.log(`${signal} received. Shutting down...`);

    if (simulationTimer) {
        clearInterval(simulationTimer);
    }

    railwaySocket.close()
        .catch(error => {
            console.error(
                "WebSocket shutdown error:",
                error.message
            );
        })
        .finally(() => {
            server.close(() => {
                console.log("HTTP server closed.");
                process.exit(0);
            });
        });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
