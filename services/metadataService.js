
const METADATA_BASE_URL =
    "http://169.254.169.254/latest";

const REQUEST_TIMEOUT_MS = 1000;

const serverInfo = {
    instanceId: "UNAVAILABLE",
    availabilityZone: "UNAVAILABLE",
    region:
        process.env.AWS_REGION ||
        process.env.AWS_DEFAULT_REGION ||
        "us-east-1",
    environment:
        process.env.RAILWAY_ENVIRONMENT ||
        process.env.ENVIRONMENT_NAME ||
        "Elastic Beanstalk"
};

async function requestMetadata(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
        });

        if (!response.ok) {
            return null;
        }

        return await response.text();
    } catch {
        return null;
    }
}

async function loadServerInfo() {
    const token = await requestMetadata(
        `${METADATA_BASE_URL}/api/token`,
        {
            method: "PUT",
            headers: {
                "X-aws-ec2-metadata-token-ttl-seconds": "21600"
            }
        }
    );

    if (!token) {
        console.log(
            "EC2 metadata unavailable; using default server information."
        );
        return { ...serverInfo };
    }

    const headers = {
        "X-aws-ec2-metadata-token": token
    };

    const [instanceId, availabilityZone, region] =
        await Promise.all([
            requestMetadata(
                `${METADATA_BASE_URL}/meta-data/instance-id`,
                { headers }
            ),
            requestMetadata(
                `${METADATA_BASE_URL}/meta-data/placement/availability-zone`,
                { headers }
            ),
            requestMetadata(
                `${METADATA_BASE_URL}/meta-data/placement/region`,
                { headers }
            )
        ]);

    if (instanceId) {
        serverInfo.instanceId = instanceId;
    }

    if (availabilityZone) {
        serverInfo.availabilityZone = availabilityZone;
    }

    if (region) {
        serverInfo.region = region;
    }

    console.log("AWS server information:", serverInfo);

    return { ...serverInfo };
}

function getServerInfo() {
    return { ...serverInfo };
}

module.exports = {
    loadServerInfo,
    getServerInfo
};
