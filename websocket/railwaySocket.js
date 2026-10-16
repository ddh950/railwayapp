
const WebSocket = require("ws");

const { createRailwayUpdate } =
    require("../services/railwayService");

function sendUpdate(client, update) {
    if (client.readyState !== WebSocket.OPEN) {
        return;
    }

    client.send(JSON.stringify(update), error => {
        if (error) {
            console.error(
                "Failed to send WebSocket update:",
                error.message
            );
        }
    });
}

function broadcastUpdate(wss, update) {
    wss.clients.forEach(client => {
        sendUpdate(client, update);
    });
}

function initializeRailwaySocket(server) {
    const wss = new WebSocket.Server({ server });

    wss.on("connection", socket => {
        console.log("WebSocket client connected.");

        sendUpdate(socket, createRailwayUpdate());

        socket.on("error", error => {
            console.error(
                "WebSocket client error:",
                error.message
            );
        });

        socket.on("close", () => {
            console.log("WebSocket client disconnected.");
        });
    });

    wss.on("error", error => {
        console.error(
            "WebSocket server error:",
            error.message
        );
    });

    return {
        broadcastUpdate: update =>
            broadcastUpdate(wss, update),

        close: () => new Promise((resolve, reject) => {
            wss.close(error => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        })
    };
}

module.exports = {
    initializeRailwaySocket
};
