/* eslint-disable no-unused-vars */
/* global itowns */

/**
 * GeoPose to Three.js conversion utilities
 * Converts GeoPose angles (yaw, pitch, roll in degrees) to Three.js Euler rotations
 */

/**
 * Convert GeoPose angles to Three.js Euler rotation format
 * @param {GeoPose} geopose - GeoPose object with angles in degrees
 * @returns {THREE.Euler} Three.js Euler object in radians with YXZ order
 *
 * Order: YXZ represents rotation order (Yaw -> Pitch -> Roll)
 * - Yaw: rotation around vertical axis (Z)
 * - Pitch: rotation around E-W horizontal axis (X)
 * - Roll: rotation around N-S axis (Y)
 */
function geoposeToThreeRotation(geopose) {
    const yawRad = itowns.THREE.MathUtils.degToRad(geopose.angles.yaw);
    const pitchRad = itowns.THREE.MathUtils.degToRad(geopose.angles.pitch);
    const rollRad = itowns.THREE.MathUtils.degToRad(geopose.angles.roll);

    return new itowns.THREE.Euler(pitchRad, yawRad, rollRad, 'YXZ');
}

/**
 * Apply GeoPose rotation to a Three.js object (camera, mesh, etc.)
 * @param {itowns.THREE.Object3D} object - Three.js object to rotate (e.g., camera)
 * @param {GeoPose} geopose - GeoPose object with orientation
 */
function applyGeoposeRotation(object, geopose) {
    const euler = geoposeToThreeRotation(geopose);
    object.rotation.order = 'YXZ';
    object.rotation.copy(euler);
    object.updateMatrixWorld();
}

/**
 * Convert Three.js Euler rotation back to GeoPose angles (degrees)
 * @param {itowns.THREE.Euler} euler - Three.js Euler object
 * @returns {Object} Object with yaw, pitch, roll in degrees
 */
function threeRotationToGeopose(euler) {
    return {
        yaw: itowns.THREE.MathUtils.radToDeg(euler.z),
        pitch: itowns.THREE.MathUtils.radToDeg(euler.x),
        roll: itowns.THREE.MathUtils.radToDeg(euler.y),
    };
}

/**
 * Create a quaternion from GeoPose angles
 * @param {GeoPose} geopose - GeoPose object with angles in degrees
 * @returns {itowns.THREE.Quaternion} Three.js quaternion representation
 */
function geoposeToQuaternion(geopose) {
    const euler = geoposeToThreeRotation(geopose);
    const quaternion = new itowns.THREE.Quaternion();
    quaternion.setFromEuler(euler);
    return quaternion;
}

/**
 * Create GeoPose angles from a quaternion
 * @param {itowns.THREE.Quaternion} quaternion - Three.js quaternion
 * @returns {Object} Object with yaw, pitch, roll in degrees
 */
function quaternionToGeopose(quaternion) {
    const euler = new itowns.THREE.Euler().setFromQuaternion(quaternion, 'YXZ');
    return threeRotationToGeopose(euler);
}
