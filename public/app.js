let previousData = null;
let updateCounter = 0;

const stationCount = 16;

const track =
    document.getElementById("track");

const stationElements = [];


/* ============================================================
   CREATE STATIONS
   ============================================================ */

for (let i = 0; i < stationCount; i++) {

    const station =
        document.createElement("div");

    station.className =
        "station waiting";

    station.textContent =
        `S${String(i + 1).padStart(2, "0")}`;

    const angle =
        (i / stationCount) *
        Math.PI * 2 -
        Math.PI / 2;

    const x =
        50 + Math.cos(angle) * 50;

    const y =
        50 + Math.sin(angle) * 50;

    station.style.left =
        `${x}%`;

    station.style.top =
        `${y}%`;

    track.appendChild(station);

    stationElements.push(station);
}


/* ============================================================
   TIME
   ============================================================ */

function formatTime(seconds) {

    seconds =
        Math.max(0, seconds);

    return `00:${String(seconds)
        .padStart(2, "0")}`;
}


function formatServerTime(timestamp) {

    if (!timestamp) {
        return "--";
    }

    return new Date(timestamp)
        .toLocaleTimeString("de-DE");
}


/* ============================================================
   FLASH
   ============================================================ */

function flashElement(element) {

    element.classList.remove(
        "value-updated"
    );

    void element.offsetWidth;

    element.classList.add(
        "value-updated"
    );
}


/* ============================================================
   WAITING PASSENGERS
   ============================================================ */

function updateWaitingNumber(
    element,
    newValue,
    oldValue
) {

    element.textContent =
        newValue;

    if (
        oldValue !== undefined &&
        newValue !== oldValue
    ) {

        element.classList.remove(
            "waiting-number-updated"
        );

        void element.offsetWidth;

        element.classList.add(
            "waiting-number-updated"
        );
    }
}


/* ============================================================
   UPDATE UI
   ============================================================ */

function updateUI(data) {

    updateCounter++;


    /* Current station */

    document.getElementById(
        "currentStation"
    ).textContent =
        data.currentStation;


    document.getElementById(
        "haltStation"
    ).textContent =
        data.currentStation;


    /* Countdown */

    document.getElementById(
        "departure"
    ).textContent =
        formatTime(
            data.phaseRemaining
        );


    /* Next station */

    document.getElementById(
        "nextStation"
    ).textContent =
        data.nextStation;


    document.getElementById(
        "eta"
    ).textContent =
        `Ankunft · ${formatTime(
            data.etaToNext
        )}`;


    /* Passengers */

    const passengers =
        document.getElementById(
            "passengers"
        );

    if (
        previousData &&
        previousData.passengersOnBoard !==
        data.passengersOnBoard
    ) {

        flashElement(passengers);
    }

    passengers.textContent =
        data.passengersOnBoard;


    /* Halt / Fahrt */

    document.getElementById(
        "haltTime"
    ).textContent =
        `${data.phase === "HALT"
            ? "HALT"
            : "FAHRT"} · ${formatTime(
                data.phaseRemaining
            )}`;


    /* Stations */

    data.stations.forEach(
        (station, index) => {

            const element =
                stationElements[index];

            const oldStation =
                previousData
                    ?.stations?.[index];

            element.className =
                "station " +
                station.status.toLowerCase();


            if (
                oldStation &&
                oldStation.status !==
                station.status
            ) {

                element.classList.add(
                    "station-status-change"
                );

                setTimeout(() => {

                    element.classList.remove(
                        "station-status-change"
                    );

                }, 750);
            }

        }
    );


    /* Waiting passengers */

    const waitingList =
        document.getElementById(
            "waitingList"
        );


    data.stations.forEach(
        (station, index) => {

            let item =
                document.getElementById(
                    `waiting-${station.id}`
                );


            if (!item) {

                item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "waiting-item";

                item.id =
                    `waiting-${station.id}`;

                item.innerHTML = `
                    <span>
                        ${station.id}
                    </span>

                    <span
                        class="waiting-count"
                        id="waiting-count-${station.id}"
                    >
                        ${station.waiting}
                    </span>
                `;

                waitingList.appendChild(
                    item
                );
            }


            const numberElement =
                document.getElementById(
                    `waiting-count-${station.id}`
                );


            const oldWaiting =
                previousData
                    ?.stations?.[index]
                    ?.waiting;


            updateWaitingNumber(
                numberElement,
                station.waiting,
                oldWaiting
            );

        }
    );


    /* ========================================================
       SERVER INFORMATION
       ======================================================== */

    document.getElementById(
        "updateCounter"
    ).textContent =
        updateCounter;


    document.getElementById(
        "serverTime"
    ).textContent =
        formatServerTime(
            data.serverTime ||
            data.timestamp
        );


    document.getElementById(
        "clientTime"
    ).textContent =
        new Date()
            .toLocaleTimeString(
                "de-DE"
            );


    document.getElementById(
        "lastUpdate"
    ).textContent =
        formatServerTime(
            data.timestamp
        );


    document.getElementById(
        "region"
    ).textContent =
        data.region || "--";


    document.getElementById(
        "instanceId"
    ).textContent =
        data.serverInstanceId ||
        "UNAVAILABLE";


    document.getElementById(
        "availabilityZone"
    ).textContent =
        data.availabilityZone ||
        "UNAVAILABLE";


    document.getElementById(
        "transport"
    ).textContent =
        data.transport ||
        "WebSocket";


    document.getElementById(
        "dataOrigin"
    ).textContent =
        `DATA ORIGIN: ${
            data.dataOrigin ||
            "SERVER GENERATED"
        }`;


    document.getElementById(
        "connection"
    ).textContent =
        "CONNECTED";


    previousData =
        structuredClone(data);
}


/* ============================================================
   WEBSOCKET
   ============================================================ */

const protocol =
    window.location.protocol === "https:"
        ? "wss:"
        : "ws:";


const socket =
    new WebSocket(
        `${protocol}//${window.location.host}`
    );


socket.onopen = () => {

    document.getElementById(
        "connection"
    ).textContent =
        "CONNECTED";
};


socket.onmessage = event => {

    try {

        const message =
            JSON.parse(event.data);

        if (
            message.type ===
            "railway-update"
        ) {

            updateUI(
                message.data
            );
        }

    } catch (error) {

        console.error(
            "Invalid server message:",
            error
        );
    }
};


socket.onclose = () => {

    document.getElementById(
        "connection"
    ).textContent =
        "DISCONNECTED";

    document.getElementById(
        "dataOrigin"
    ).textContent =
        "DATA ORIGIN: CONNECTION LOST";
};


socket.onerror = () => {

    document.getElementById(
        "connection"
    ).textContent =
        "CONNECTION ERROR";
};

/* ============================================================
   COGNITO LOGIN
   ============================================================ */

const COGNITO_DOMAIN =
    "https://railway-live-331794.auth.us-east-1.amazoncognito.com";

const COGNITO_CLIENT_ID =
    "481ah4pgfu91jmc4hdvorp0cjt";

const REDIRECT_URI =
    window.location.origin + "/";


const loginButton =
    document.getElementById(
        "loginButton"
    );


if (loginButton) {

    loginButton.addEventListener(
        "click",
        () => {

            const loginUrl =
                `${COGNITO_DOMAIN}/oauth2/authorize` +
                `?client_id=${encodeURIComponent(
                    COGNITO_CLIENT_ID
                )}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent(
                    "openid email"
                )}` +
                `&redirect_uri=${encodeURIComponent(
                    REDIRECT_URI
                )}`;

            window.location.href =
                loginUrl;

        }
    );

}