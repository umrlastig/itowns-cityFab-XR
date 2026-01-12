/**
 * GeoPose to Three.js conversion utilities
 * Converts GeoPose angles (yaw, pitch, roll in degrees) to Three.js Euler rotations
 */

import * as THREE from 'three';

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
export function geoposeToThreeRotation(geopose) {
    const yawRad = THREE.MathUtils.degToRad(geopose.angles.yaw);
    const pitchRad = THREE.MathUtils.degToRad(geopose.angles.pitch);
    const rollRad = THREE.MathUtils.degToRad(geopose.angles.roll);
    
    return new THREE.Euler(pitchRad, yawRad, rollRad, 'YXZ');
}

/**
 * Apply GeoPose rotation to a Three.js object (camera, mesh, etc.)
 * @param {THREE.Object3D} object - Three.js object to rotate (e.g., camera)
 * @param {GeoPose} geopose - GeoPose object with orientation
 */
export function applyGeoposeRotation(object, geopose) {
    const euler = geoposeToThreeRotation(geopose);
    object.rotation.order = 'YXZ';
    object.rotation.copy(euler);
    object.updateMatrixWorld();
}

/**
 * Convert Three.js Euler rotation back to GeoPose angles (degrees)
 * @param {THREE.Euler} euler - Three.js Euler object
 * @returns {Object} Object with yaw, pitch, roll in degrees
 */
export function threeRotationToGeopose(euler) {
    return {
        yaw: THREE.MathUtils.radToDeg(euler.z),
        pitch: THREE.MathUtils.radToDeg(euler.x),
        roll: THREE.MathUtils.radToDeg(euler.y)
    };
}

/**
 * Create a quaternion from GeoPose angles
 * @param {GeoPose} geopose - GeoPose object with angles in degrees
 * @returns {THREE.Quaternion} Three.js quaternion representation
 */
export function geoposeToQuaternion(geopose) {
    const euler = geoposeToThreeRotation(geopose);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromEuler(euler);
    return quaternion;
}

/**
 * Create GeoPose angles from a quaternion
 * @param {THREE.Quaternion} quaternion - Three.js quaternion
 * @returns {Object} Object with yaw, pitch, roll in degrees
 */
export function quaternionToGeopose(quaternion) {
    const euler = new THREE.Euler().setFromQuaternion(quaternion, 'YXZ');
    return threeRotationToGeopose(euler);
}
