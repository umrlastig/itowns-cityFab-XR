/* eslint-disable linebreak-style */
// Utility functions for iTowns XR Example
async function getCurrentPosition() {
    if (!navigator.geolocation) { throw new Error('Geolocation not supported'); }
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

// data = { geo, rotation, speedMps, antennaID, src, tMillis }
export function updateGNSSStatus(TCP_status, data) {
    document.getElementById('info').innerHTML =
        `<li><b>TCP server status:</b> ${TCP_status}</li>
        <li><b>Position:</b>
        <ul>
            <li><b>Longitude:</b> ${data.geo.longitude}</li>
            <li><b>Latitude:</b> ${data.geo.latitude}</li>
        </ul>
        </li>
        <li><b>Rotation:</b>
        <ul> 
            <li><b>Heading:</b> ${data.rotation.heading}</li>
        </ul>
        </li>
        <li><b>Speed (m/s):</b> ${data.speedMps}</li>
        <li><b>Antenna ID:</b> ${data.antennaID}</li>
        <li><b>Source:</b> ${data.src}</li>
        <li><b>Timestamp (ms):</b> ${data.tMillis}</li>`;
}

function displayProperties(properties) {
    const htmlInfo = document.getElementById('info');
    htmlInfo.innerHTML = '';
    Object.entries(properties)
        .filter(([k, v]) => v && !k.startsWith('_') && k !== 'geometry_name')
        .forEach(([k, v]) => {
            htmlInfo.innerHTML += `<li><b>${k}:</b> ${v}</li>`;
        });
}
