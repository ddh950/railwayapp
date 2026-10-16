
const {
    STATION_COUNT,
    HALT_SECONDS,
    TRAVEL_SECONDS,
    INITIAL_STATION_INDEX,
    INITIAL_PASSENGERS,
    MAX_WAITING_PASSENGERS,
    MAX_BOARDING_PER_STOP
} = require("../config/railway");

const { getServerInfo } = require("./metadataService");

let currentStationIndex = INITIAL_STATION_INDEX;
let phase = "HALT";
let phaseRemaining = HALT_SECONDS;
let nextPassengerId = 1;

let passengers = [];

let waitingPassengers = Array.from(
    { length: STATION_COUNT },
    () => randomInt(0, MAX_WAITING_PASSENGERS)
);

function randomInt(min, max) {
    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function stationId(index) {
    return `S${String(index + 1).padStart(2, "0")}`;
}

function getCurrentStation() {
    return stationId(currentStationIndex);
}

function getNextStation() {
    return stationId(
        (currentStationIndex + 1) % STATION_COUNT
    );
}

function getEtaToNext() {
    return phase === "HALT"
        ? phaseRemaining + TRAVEL_SECONDS
        : phaseRemaining;
}

function getStationStatus(index) {
    if (index === currentStationIndex) {
        return "ONBOARD";
    }

    const distance =
        (index - currentStationIndex + STATION_COUNT) %
        STATION_COUNT;

    return distance > STATION_COUNT / 2
        ? "COMPLETED"
        : "WAITING";
}

function createStations() {
    return Array.from(
        { length: STATION_COUNT },
        (_, index) => ({
            id: stationId(index),
            status: getStationStatus(index),
            waiting: waitingPassengers[index]
        })
    );
}

function createPassenger() {
    // Destination is 1 to STATION_COUNT - 1 stops ahead.
    // A passenger cannot have the current station as destination.
    const distance = randomInt(1, STATION_COUNT - 1);

    return {
        id: nextPassengerId++,
        destinationIndex:
            (currentStationIndex + distance) % STATION_COUNT
    };
}

function processPassengersAtStation() {
    // Passengers leave at their destination.
    passengers = passengers.filter(
        passenger =>
            passenger.destinationIndex !== currentStationIndex
    );

    // Simulate changing passenger demand at stations.
    waitingPassengers[currentStationIndex] =
        randomInt(0, MAX_WAITING_PASSENGERS);

    for (let index = 0; index < STATION_COUNT; index++) {
        if (Math.random() < 0.15) {
            waitingPassengers[index] =
                randomInt(0, MAX_WAITING_PASSENGERS);
        }
    }

    // A random number of waiting passengers boards.
    const waiting = waitingPassengers[currentStationIndex];

    const boarding = Math.min(
        waiting,
        randomInt(0, MAX_BOARDING_PER_STOP)
    );

    waitingPassengers[currentStationIndex] -= boarding;

    for (let i = 0; i < boarding; i++) {
        passengers.push(createPassenger());
    }
}

function advanceSimulation() {
    phaseRemaining--;

    if (phaseRemaining <= 0 && phase === "HALT") {
        phase = "FAHRT";
        phaseRemaining = TRAVEL_SECONDS;
    } else if (phaseRemaining <= 0 && phase === "FAHRT") {
        currentStationIndex =
            (currentStationIndex + 1) % STATION_COUNT;

        processPassengersAtStation();

        phase = "HALT";
        phaseRemaining = HALT_SECONDS;
    }

    return createRailwayUpdate();
}

function createRailwayUpdate() {
    const serverInfo = getServerInfo();
    const timestamp = new Date().toISOString();

    return {
        type: "railway-update",
        data: {
            currentStation: getCurrentStation(),
            nextStation: getNextStation(),
            phase,
            phaseRemaining,
            etaToNext: getEtaToNext(),
            passengersOnBoard: passengers.length,
            stations: createStations(),
            timestamp,
            serverTime: timestamp,
            serverInstanceId: serverInfo.instanceId,
            availabilityZone: serverInfo.availabilityZone,
            region: serverInfo.region,
            environment: serverInfo.environment,
            dataOrigin: "SERVER GENERATED",
            transport: "WebSocket"
        }
    };
}

// Initialize the original three passengers.
for (let i = 0; i < INITIAL_PASSENGERS; i++) {
    passengers.push(createPassenger());
}

function startSimulation(onUpdate) {
    return setInterval(() => {
        const update = advanceSimulation();
        onUpdate(update);
    }, 1000);
}

module.exports = {
    createRailwayUpdate,
    startSimulation
};
