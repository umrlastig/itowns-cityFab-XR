/* eslint-disable linebreak-style */
// Utility functions for iTowns XR Example
async function getCurrentPosition() {
    if (!navigator.geolocation) {throw new Error('Geolocation not supported');}
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

function updateGNSSStatus(TCP_status, geo, rotation) {
    document.getElementById('info').innerHTML =
        `<li><b>TCP server status:</b> ${TCP_status}</li>
        <li><b>Long:</b> ${geo.longitude}</li>
        <li><b>Lat:</b> ${geo.latitude}</li>
        <li><b>Heading:</b> ${rotation.heading}</li>
        <li><b>Pitch:</b> ${rotation.pitch}</li>`;
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
