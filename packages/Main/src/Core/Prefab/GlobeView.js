import * as THREE from 'three';

import View, { VIEW_EVENTS } from 'Core/View';
import GlobeControls from 'Controls/GlobeControls';
import { Coordinates, ellipsoidSizes, CoordStars } from '@itowns/geographic';
import GlobeLayer from 'Core/Prefab/Globe/GlobeLayer';
import Atmosphere from 'Core/Prefab/Globe/Atmosphere';
import CameraUtils from 'Utils/CameraUtils';
import WebXR from 'Renderer/WebXR';

/**
 * Fires when the view is completely loaded. Controls and view's functions can be called then.
 * @event GlobeView#initialized
 * @property target {view} dispatched on view
 * @property type {string} initialized
 */
/**
 * Fires when a layer is added
 * @event GlobeView#layer-added
 * @property layerId {string} the id of the layer
 * @property target {view} dispatched on view
 * @property type {string} layers-added
 */
/**
 * Fires when a layer is removed
 * @event GlobeView#layer-removed
 * @property layerId {string} the id of the layer
 * @property target {view} dispatched on view
 * @property type {string} layers-added
 */
/**
 * Fires when the layers oder has changed
 * @event GlobeView#layers-order-changed
 * @property new {object}
 * @property new.sequence {array}
 * @property new.sequence.0 {number} the new layer at position 0
 * @property new.sequence.1 {number} the new layer at position 1
 * @property new.sequence.2 {number} the new layer at position 2
 * @property previous {object}
 * @property previous.sequence {array}
 * @property previous.sequence.0 {number} the previous layer at position 0
 * @property previous.sequence.1 {number} the previous layer at position 1
 * @property previous.sequence.2 {number} the previous layer at position 2
 * @property target {view} dispatched on view
 * @property type {string} layers-order-changed
 */


/**
 * Globe's EVENT
 * @property GLOBE_INITIALIZED {string} Deprecated: emit one time when globe is initialized (use VIEW_EVENTS.INITIALIZED instead).
 * @property LAYER_ADDED {string} Deprecated: emit when layer id added in viewer (use VIEW_EVENTS.LAYER_ADDED instead).
 * @property LAYER_REMOVED {string} Deprecated: emit when layer id removed in viewer (use VIEW_EVENTS.LAYER_REMOVED instead).
 * @property COLOR_LAYERS_ORDER_CHANGED {string} Deprecated: emit when  color layers order change (use VIEW_EVENTS.COLOR_LAYERS_ORDER_CHANGED instead).
 */

export const GLOBE_VIEW_EVENTS = {
    GLOBE_INITIALIZED: VIEW_EVENTS.INITIALIZED,
    LAYER_ADDED: VIEW_EVENTS.LAYER_ADDED,
    LAYER_REMOVED: VIEW_EVENTS.LAYER_REMOVED,
    COLOR_LAYERS_ORDER_CHANGED: VIEW_EVENTS.COLOR_LAYERS_ORDER_CHANGED,
};

class GlobeView extends View {
    /**
     * Creates a view of a globe.
     *
     * @extends View
     *
     * @example <caption><b>Instance GlobeView.</b></caption>
     * var viewerDiv = document.getElementById('viewerDiv');
     * const placement = {
     *     coord: new itowns.Coordinates('EPSG:4326', 2.351323, 48.856712),
     *     range: 25000000,
     * }
     * var view = new itowns.GlobeView(viewerDiv, placement);
     *
     * @param {HTMLDivElement} viewerDiv - Where to attach the view and display it
     * in the DOM.
     * @param {CameraTransformOptions|Extent} placement - An object to place view
     * @param {object} [options] - See options of {@link View}.
     * @param {Object} [options.controls] - See options of {@link GlobeControls}
     * @param {Object} [options.webXR] - WebXR configuration - its presence alone
     * enable WebXR to switch on VR visualization. (optional).
     * @param {function} [options.webXR.callback] - WebXR rendering callback (optional).
     * @param {boolean} [options.webXR.controllers] - Enable the webXR controllers handling (optional).
     */
    constructor(viewerDiv, placement = {}, options = {}) {
        THREE.Object3D.DEFAULT_UP.set(0, 0, 1);
        // Setup View
        super('EPSG:4978', viewerDiv, options);
        this.isGlobeView = true;

        this.camera3D.near = Math.max(15.0, 0.000002352 * ellipsoidSizes.x);
        this.camera3D.far = ellipsoidSizes.x * 10;

        const tileLayer = new GlobeLayer('globe', options.object3d, options);
        this.mainLoop.gfxEngine.label2dRenderer.infoTileLayer = tileLayer.info;

        this.addLayer(tileLayer);
        this.tileLayer = tileLayer;

        if (!placement.isExtent) {
            placement.coord = placement.coord || new Coordinates('EPSG:4326', 0, 0);
            placement.tilt = placement.tilt || 89.5;
            placement.heading = placement.heading || 0;
            placement.range = placement.range || ellipsoidSizes.x * 2.0;
        }

        if (options.noControls) {
            CameraUtils.transformCameraToLookAtTarget(this, this.camera3D, placement);
        } else {
            this.controls = new GlobeControls(this, placement, options.controls);
            this.controls.handleCollision = typeof (options.handleCollision) !== 'undefined' ? options.handleCollision : true;
        }

        this.addLayer(new Atmosphere('atmosphere', options.atmosphere));

        // GlobeView needs this.camera.resize to set perpsective matrix camera
        this.camera.resize(viewerDiv.clientWidth, viewerDiv.clientHeight);

        if (options.webXR) {
            this.webXR = new WebXR(this, typeof options.webXR === 'boolean' ? {} : options.webXR);
            this.webXR.initializeWebXR();
        }
    }

    /**
     * Add layer in viewer.
     * The layer id must be unique.
     *
     * The `layer.whenReady` is a promise that resolves when
     * the layer is done. This promise is also returned by
     * `addLayer` allowing to chain call.
     *
     * The layer added is attached, by default to `GlobeLayer` (`GlobeView.tileLayer`).
     * If you want add a unattached layer use `View#addLayer` parent method.
     *
     * @param {LayerOptions|Layer|GeometryLayer} layer The layer to add in view.
     * @return {Promise} a promise resolved with the new layer object when it is fully initialized or rejected if any error occurred.
     */
    addLayer(layer) {
        if (!layer || !layer.isLayer) {
            return Promise.reject(new Error('Add Layer type object'));
        }
        if (layer.isColorLayer) {
            if (!this.tileLayer.tileMatrixSets.includes(layer.source.crs)) {
                return layer._reject(`Only ${this.tileLayer.tileMatrixSets} tileMatrixSet are currently supported for color layers`);
            }
        } else if (layer.isElevationLayer) {
            if (layer.source.crs !== this.tileLayer.tileMatrixSets[0]) {
                return layer._reject(`Only ${this.tileLayer.tileMatrixSets[0]} tileMatrixSet is currently supported for elevation layers`);
            }
        }

        return super.addLayer(layer, this.tileLayer);
    }

    getPixelsToDegrees(pixels = 1, screenCoord) {
        return this.getMetersToDegrees(this.getPixelsToMeters(pixels, screenCoord));
    }

    getPixelsToDegreesFromDistance(pixels = 1, distance = 1) {
        return this.getMetersToDegrees(this.getPixelsToMetersFromDistance(pixels, distance));
    }

    getMetersToDegrees(meters = 1) {
        return THREE.MathUtils.radToDeg(2 * Math.asin(meters / (2 * ellipsoidSizes.x)));
    }

    /**
     *
     * @returns {THREE.Vector3} sun position
     */
    simulateSun() {
        // Get camera's current position
        const cameraPos = this.camera.camera3D.position;
        const geoCoords = new Coordinates('EPSG:4978', cameraPos.x, cameraPos.y, cameraPos.z).as('EPSG:4326');
        const longitude = geoCoords.longitude;
        const latitude = geoCoords.latitude;

        // Get current date and time
        const now = new Date();

        // Compute sun position
        const sunPos = CoordStars.getSunPositionInScene(now, longitude, latitude);

        return sunPos;
    }
}

export default GlobeView;
