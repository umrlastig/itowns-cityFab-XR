/* eslint-disable no-unused-vars */
/**
 * GeoPose Standard Implementation
 * Based on: Basic-YPR (Yaw, Pitch, Roll) specification
 *
 * Reference: https://www.ogc.org/standards/geopose
 * JSON Schema validation for position (lat, lon, h) and angles (yaw, pitch, roll)
 */

class GeoPose {
    /**
     * Create a GeoPose object following the OGC GeoPose standard
     * @param {number} lat - Latitude in degrees (-90 to 90)
     * @param {number} lon - Longitude in degrees (-180 to 180)
     * @param {number} h - Altitude/Height in meters above reference ellipsoid
     * @param {number} yaw - Rotation around vertical axis in degrees (0-360)
     * @param {number} pitch - Rotation around E-W horizontal axis in degrees (-180 to 180)
     * @param {number} roll - Rotation around N-S axis in degrees (-180 to 180)
     */
    constructor(lat, lon, h, yaw = 0, pitch = 0, roll = 0) {
        this.position = {
            lat: lat,      // latitude in degrees
            lon: lon,      // longitude in degrees
            h: h,           // altitude in meters
        };
        this.angles = {
            yaw: yaw,      // rotation around vertical axis (degrees)
            pitch: pitch,  // rotation around horizontal axis E-W (degrees)
            roll: roll,     // rotation around N-S axis (degrees)
        };
    }

    /**
     * Validate GeoPose object against the JSON schema
     * @throws {Error} If GeoPose does not match the schema
     * @returns {boolean} True if valid
     */
    validate() {
        if (!this.position || typeof this.position !== 'object') {
            throw new Error('GeoPose: position object is required');
        }

        if (typeof this.position.lat !== 'number' ||
            typeof this.position.lon !== 'number' ||
            typeof this.position.h !== 'number') {
            throw new Error('GeoPose: position must contain numeric lat, lon, and h properties');
        }

        // Optional: validate coordinate ranges
        if (this.position.lat < -90 || this.position.lat > 90) {
            throw new Error('GeoPose: latitude must be between -90 and 90 degrees');
        }
        if (this.position.lon < -180 || this.position.lon > 180) {
            throw new Error('GeoPose: longitude must be between -180 and 180 degrees');
        }

        if (!this.angles || typeof this.angles !== 'object') {
            throw new Error('GeoPose: angles object is required');
        }

        if (typeof this.angles.yaw !== 'number' ||
            typeof this.angles.pitch !== 'number' ||
            typeof this.angles.roll !== 'number') {
            throw new Error('GeoPose: angles must contain numeric yaw, pitch, and roll properties');
        }

        return true;
    }

    /**
     * Convert to JSON following GeoPose schema
     * @returns {Object} JSON representation of GeoPose
     */
    toJSON() {
        return {
            position: {
                lat: this.position.lat,
                lon: this.position.lon,
                h: this.position.h,
            },
            angles: {
                yaw: this.angles.yaw,
                pitch: this.angles.pitch,
                roll: this.angles.roll,
            },
        };
    }

    /**
     * Create GeoPose from JSON object
     * @param {Object} data - JSON object matching GeoPose schema
     * @returns {GeoPose} GeoPose instance
     * @throws {Error} If JSON does not match schema
     */
    static fromJSON(data) {
        const geopose = new GeoPose(
            data.position.lat,
            data.position.lon,
            data.position.h,
            data.angles.yaw,
            data.angles.pitch,
            data.angles.roll,
        );
        geopose.validate();
        return geopose;
    }

    /**
     * Create GeoPose from GNSS data
     * @param {Object} gnss - Data from GNSS receiver with properties: lat, lon, altitude, headingDeg
     * @param {number} yaw - Optional yaw angle in degrees (default: 0)
     * @param {number} pitch - Optional pitch angle in degrees (default: 0)
     * @param {number} roll - Optional roll angle in degrees (default: 0)
     * @returns {GeoPose} GeoPose instance
     */
    static fromGNSS(gnss, yaw = 0, pitch = 0, roll = 0) {
        return new GeoPose(
            gnss.lat,
            gnss.lon,
            gnss.altitude || 0,
            yaw,  // Yaw from GNSS heading
            pitch,
            roll,
        );
    }

    /**
     * Update angles from new orientation data
     * @param {number} yaw - Yaw angle in degrees
     * @param {number} pitch - Pitch angle in degrees
     * @param {number} roll - Roll angle in degrees
     */
    setAngles(yaw, pitch, roll) {
        this.angles = {
            yaw: yaw,
            pitch: pitch,
            roll: roll,
        };
    }

    /**
     * Update position from new location data
     * @param {number} lat - Latitude in degrees
     * @param {number} lon - Longitude in degrees
     * @param {number} h - Altitude in meters
     */
    setPosition(lat, lon, h) {
        this.position = {
            lat: lat,
            lon: lon,
            h: h,
        };
    }

    /**
     * Clone this GeoPose object
     * @returns {GeoPose} Deep copy of this GeoPose
     */
    clone() {
        return new GeoPose(
            this.position.lat,
            this.position.lon,
            this.position.h,
            this.angles.yaw,
            this.angles.pitch,
            this.angles.roll,
        );
    }
}
