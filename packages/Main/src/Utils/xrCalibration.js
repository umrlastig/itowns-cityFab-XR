/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
/* eslint-disable linebreak-style */
// XR Calibration UI logic for iTowns XR Example
import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';


function makeButtonMesh(x, y, z, color, name, label, createText) {
    const geometry = new THREE.BoxGeometry(x, y, z);
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = name;
    if (label && createText) {
        const textObj = createText(label, 0.06);
        textObj.position.set(0, 0, 0.0051);
        textObj.name = name;
        mesh.add(textObj);
    }
    return mesh;
}

/**
 *
 * @param {THREE.Vector3} bWorld
 * @param {THREE.Matrix3} Rx
 * @param {THREE.Matrix3} Rz
 * @returns {number} theta angle in radians
 */
function calculateRyAngleFromWorldBaseline(bWorld, Rx, Rz) {
    // v1 = Rx * (1, 0, 0) - local baseline rotated by Rx
    const v1 = new THREE.Vector3(1, 0, 0).applyMatrix3(Rx);

    // v2 = Rz^T * bWorld - remove Rz rotation to get Ry*Rx effect
    const RzT = new THREE.Matrix3().copy(Rz).transpose();
    const v2 = bWorld.clone().applyMatrix3(RzT);

    // theta from XZ (Y rotation)
    const angle_v1 = Math.atan2(v1.z, v1.x);
    const angle_v2 = Math.atan2(v2.z, v2.x);
    const theta = angle_v2 - angle_v1;

    // Valide Y
    const yDiff = Math.abs(v1.y - v2.y);
    if (yDiff > 0.01) {
        console.warn(`Y component mismatch: ${yDiff}. Check rotation order or data.`);
    }

    console.log(`Calculated Ry angle (theta): ${THREE.MathUtils.radToDeg(theta).toFixed(2)}°`);
    return theta;
}

export function setupXRCalibrationUI(view, createText, rotation) {
    const rotationGnss = rotation;
    const xr = view.renderer.xr;
    const buildingsHand = [];
    const buildingsGround = [];
    const objectsCityHall = [];
    const modelsName = ['LEG-media_library_V2', 'LEG-media_library_alternative_A_V1', 'LEG-media_library_alternative_B_V1'];

    // Occlusion variables
    let depthActive = false;

    // Setup depth occlusion - simplified approach without XRWebGLBinding
    function setupDepthOcclusionLayer(session) {
        if (!session) {
            console.warn('Session not available');
            return false;
        }

        try {
            if (typeof session.requestDepthSensing === 'function') {
                session.requestDepthSensing();
                console.log('✓ Depth sensing enabled - real objects will occlude virtual objects');
                return true;
            } else {
                console.warn('Depth sensing not available on this device/session');
                return false;
            }
        } catch (e) {
            console.warn('Error enabling depth sensing:', e.message);
            return false;
        }
    }

    function toggleDepthSensing(session, enable) {
        if (!session) {
            console.warn('Session not available');
            return;
        }

        try {
            if (enable) {
                if (typeof session.requestDepthSensing === 'function') {
                    session.requestDepthSensing();
                    console.log('✓ Depth sensing enabled');
                } else {
                    console.warn('requestDepthSensing not available');
                }
            } else if (typeof session.pauseDepthSensing === 'function') {
                    session.pauseDepthSensing();
                    console.log('✓ Depth sensing paused');
                }
        } catch (e) {
            console.warn('Error toggling depth sensing:', e.message);
        }
    }

    initBuildingsPlannerMode();

    // Buildings planner
    async function initBuildingsPlannerMode() {
        // ---- Load 3D model ----

        for (const name of modelsName) {
            const mtlLoader = new MTLLoader().setPath('obj/');
            // eslint-disable-next-line no-await-in-loop
            const material0 = await mtlLoader.loadAsync(`${name}.mtl`);
            material0.preload();
            const objLoader = new OBJLoader().setPath('obj/');
            objLoader.setMaterials(material0);
            // eslint-disable-next-line no-await-in-loop
            const object0 = await objLoader.loadAsync(`${name}.obj`);
            object0.position.set(view.camera.camera3D.position.x, view.camera.camera3D.position.y + 60, view.camera.camera3D.position.z + 28);
            itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', object0);
            object0.name = name;
            object0.updateMatrixWorld();
            const ambientLight = new THREE.AmbientLight(0x404040, 5); // soft white light
            view.scene.add(ambientLight);
            object0.add(ambientLight);
            objectsCityHall.push(object0);
        }

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const cube = new THREE.Mesh(geometry, material);
        cube.name = 'data';
        buildingsGround.push(cube.clone());
        buildingsHand.push(cube);

        // const buildings = [];
        for (let i = 0; i < 3; i++) {
            const objectCloneHand = objectsCityHall[i].clone();
            objectCloneHand.name = modelsName[i];
            objectCloneHand.visible = false;
            buildingsHand.push(objectCloneHand);

            const objectCloneGround = objectsCityHall[i].clone();
            objectCloneGround.name = modelsName[i];
            objectCloneGround.scale.set(0.04, 0.04, 0.04);
            objectCloneGround.visible = false;
            buildingsGround.push(objectCloneGround);

            objectsCityHall[i].visible = false;
            objectsCityHall[i].scale.set(1, 1, 1);
            view.scene.add(objectsCityHall[i]);
        }
    }

    xr.addEventListener('sessionstart', function () {
        const vrControls = view.webXR.vrControls;
        const session = this.getSession ? this.getSession() : xr.getSession();

        if (session) {
            // Try to setup depth occlusion layer
            if (!setupDepthOcclusionLayer(session)) {
                // Fallback: request depth sensing
                if (session.requestDepthSensing) {
                    session.requestDepthSensing();
                    console.log('Using depth sensing for occlusion');
                }
            }
            depthActive = true;
        }

        const scenarioText = ['data', 'scenario 1', 'scenario 2', 'scenario 3'];
        // Prepare mesh creation once
        const gnssRotationButton = makeButtonMesh(0.2, 0.1, 0.01, 0xffff00, 'gnssRotationButton', 'Gnss', createText);
        const buildingsButton = makeButtonMesh(0.3, 0.1, 0.01, 0x008000, 'buildingsButton', 'Buildings', createText);
        const leftText = createText('Y button to set transparent data', 0.03);
        const rightText = createText('A button for GNSS / B Button for urban planning', 0.03);

        const usageText = createText('', 0.03);
        const natureText = createText('', 0.03);
        const cleabsText = createText('', 0.03);

        let baseOrientation;
        if (baseOrientation == undefined) { baseOrientation = vrControls.groupXR.quaternion.clone().normalize(); }

        // prepare guizmos
        const groupGuizmo = new THREE.Group();
        const geometryLineX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(5, 0, 0)]);
        const geometryLineY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 5, 0)]);
        const geometryLineZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 5)]);
        const materialLine = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        const materialLineY = new THREE.LineBasicMaterial({ color: 0x00FF00 });
        const materialLineZ = new THREE.LineBasicMaterial({ color: 0x0000FF });
        const lineX = new THREE.Line(geometryLineX, materialLine);
        const lineY = new THREE.Line(geometryLineY, materialLineY);
        const lineZ = new THREE.Line(geometryLineZ, materialLineZ);
        groupGuizmo.add(lineX);
        groupGuizmo.add(lineY);
        groupGuizmo.add(lineZ);
        // view.scene.add(groupGuizmo);
        const guizmosGnss = groupGuizmo.clone();
        // view.scene.add(guizmosGnss);
        let indexRight; let indexLeft;


        // itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', view.webXR.vrControls.groupXR);
        const r = 0.07;

        view.webXR.vrControls.groupXR.quaternion.setFromEuler(new THREE.Euler(-3.0803198, 0.9349983 - r, -1.6468979));
        view.webXR.vrControls.groupXR.updateMatrixWorld();

        // Controller 0: highlight buttons based on pointing
        this.getController(0).addEventListener('connected', () => {
            if (this.getController(0).name == 'left') {
                indexLeft = 0; indexRight = 1;
            } else {
                indexLeft = 1; indexRight = 0;
            }

            rightText.position.set(0, 0.1, 0);
            usageText.position.set(0.25, 1.6, -0.8);
            natureText.position.set(0.25, 1.65, -0.8);
            cleabsText.position.set(0.25, 1.7, -0.8);

            view.scene.add(rightText);
            view.scene.add(usageText);
            view.scene.add(natureText);
            view.scene.add(cleabsText);

            this.getController(indexRight).add(rightText);
            view.webXR.vrControls.groupXR.add(usageText);
            view.webXR.vrControls.groupXR.add(natureText);
            view.webXR.vrControls.groupXR.add(cleabsText);
        });

        // Controller 1: add buttons and handle press
        this.getController(1).addEventListener('connected', () => {
            if (this.getController(0).name == 'left') {
                indexLeft = 0; indexRight = 1;
            } else {
                indexLeft = 1; indexRight = 0;
            }

            leftText.position.set(0, 0.1, 0);
            view.scene.add(leftText);
            this.getController(indexLeft).add(leftText);
        });

        // Handle calibration modes
        function initBuildingsMode() {
            vrControls.onRightButtonPressed = function () {};
            console.log('Buildings mode');
            gnssRotationButton.visible = false;
            buildingsButton.visible = false;
            titleText.visible = false;
            const text = createText('Buildings mode : use right gamepad to move scene and left gamepad to rotate', 0.03);
            text.position.set(0.2, 0.2, 0);
            const controllerLeft = vrControls.controllers.filter(controller => controller.name == 'left')[0];
            controllerLeft.add(text);
            vrControls.onLeftButtonPressed = function (evt) {
                [text].forEach((obj) => {
                    obj.geometry.dispose();
                    obj.material.dispose();
                    obj.visible = false;
                    obj.parent.remove(obj);
                });
                view.notifyChange();
                // startDemo();
            };
        }

        function startBuildingsPlannerMode() {
            buildingsButton.visible = false;
            gnssRotationButton.visible = false;
            leftText.visible = false;
            rightText.visible = false;

            buildingsHand.forEach((building, i) => {
                // add building to left hand
                building.visible = true;
                building.position.set(-0.1 + (i * 0.13), 0.1, 0.05); // spread cubes horizontally
                if (i === 0) {
                    building.scale.set(0.03, 0.03, 0.03);
                } else {
                    building.scale.set(0.003, 0.003, 0.003);
                }
                vrControls.controllers[indexLeft].add(building);
                building.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
                building.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / -2);
                building.updateMatrixWorld();

                const titleText = createText(scenarioText[i], 0.02);
                titleText.position.set(building.position.x, building.position.y - 0.04, building.position.z);
                vrControls.controllers[indexLeft].add(titleText);

                // // add building to ground
                // buildingsGround[i].visible = true;
                // buildingsGround[i].position.set(view.camera.camera3D.position.x + (i * 2) - 4, view.camera.camera3D.position.y - 2, view.camera.camera3D.position.z);
                // view.scene.add(buildingsGround[i]);
                // const coord = new itowns.Coordinates('EPSG:4978', buildingsGround[i].position.x, buildingsGround[i].position.y, buildingsGround[i].position.z);
                // // set object position to the coordinate
                // coord.toVector3(buildingsGround[i].position);
                // // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north..
                // buildingsGround[i].lookAt(coord.geodesicNormal.clone().add(buildingsGround[i].position));
                // itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', buildingsGround[i]);
                // buildingsGround[i].updateMatrixWorld();

                // // buildingsGround[i].rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2);
                // buildingsGround[i].updateMatrixWorld();
            });

            const groupBuildingsGround = new THREE.Group();

            buildingsGround.forEach((building, i) => {
                building.visible = true;
                building.position.set((i * 2) - 4, -2, 0);
                groupBuildingsGround.add(building);
                building.rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2);
                building.updateMatrixWorld();
            });

            groupBuildingsGround.position.set(view.camera.camera3D.position.x - 15, view.camera.camera3D.position.y, view.camera.camera3D.position.z);
            const coord = new itowns.Coordinates('EPSG:4978', groupBuildingsGround.position.x, groupBuildingsGround.position.y, groupBuildingsGround.position.z);
            // set object position to the coordinate
            coord.toVector3(groupBuildingsGround.position);
            // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north
            groupBuildingsGround.lookAt(coord.geodesicNormal.clone().add(groupBuildingsGround.position));
            itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', groupBuildingsGround);
            groupBuildingsGround.updateMatrixWorld();
            view.scene.add(groupBuildingsGround);

            vrControls.onRightButtonReleased = function (evt) {
                const buttonIndex = evt.message.buttonIndex;
                if (buttonIndex === 1) { // Grip button
                    const controllerRight = this.controllers.filter(controller => controller.name == 'right')[0];
                    let line;
                    console.log(view.webXR.vrControls.groupXR.position.z);
                    // eslint-disable-next-line no-unused-expressions
                    controllerRight.children.forEach((element) => { element.isLine ? line = element : console.warn('No line in controler'); });
                    const raycaster = new THREE.Raycaster();
                    const pos = new THREE.Vector3();
                    const dir = new THREE.Vector3();
                    if (line) {
                        line.getWorldPosition(pos);
                        line.getWorldDirection(dir);
                        raycaster.ray.origin = pos;
                        raycaster.ray.direction = dir.multiplyScalar(-1);
                        const intersects = raycaster.intersectObjects(view.scene.children);
                        const x = 4201375.606521;
                        const y = 189870.343307;
                        const z = 4779000.386590208;
                        const piRotation = Math.PI / 2;
                        intersects.forEach((intersect) => {
                            if (intersect.object.parent.name == modelsName[0]) {
                                objectsCityHall[0].visible = true;
                                objectsCityHall[1].visible = false;
                                objectsCityHall[2].visible = false;
                                objectsCityHall[0].position.set(x, y, z);
                                const coord = new itowns.Coordinates('EPSG:4978', objectsCityHall[0].position.x, objectsCityHall[0].position.y, objectsCityHall[0].position.z - 3).as('EPSG:4978');
                                // set object position to the coordinate
                                coord.toVector3(objectsCityHall[0].position);
                                // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north..
                                objectsCityHall[0].lookAt(coord.geodesicNormal.clone().add(objectsCityHall[0].position));
                                itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', objectsCityHall[0]);
                                objectsCityHall[0].updateMatrixWorld();
                                // objectsCityHall[0].rotateOnAxis(new THREE.Vector3(0, 0, 1), (-5 * Math.PI) / 6);
                                objectsCityHall[0].rotateOnAxis(new THREE.Vector3(0, 0, 1), piRotation);
                                objectsCityHall[0].updateMatrixWorld();
                            } else if (intersect.object.parent.name == modelsName[1]) {
                                objectsCityHall[0].visible = false;
                                objectsCityHall[1].visible = true;
                                objectsCityHall[2].visible = false;

                                objectsCityHall[1].position.set(x, y, z);
                                const coord = new itowns.Coordinates('EPSG:4978', objectsCityHall[1].position.x, objectsCityHall[1].position.y, objectsCityHall[1].position.z - 3).as('EPSG:4978');
                                // set object position to the coordinate
                                coord.toVector3(objectsCityHall[1].position);
                                // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north..
                                objectsCityHall[1].lookAt(coord.geodesicNormal.clone().add(objectsCityHall[1].position));
                                itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', objectsCityHall[1]);
                                objectsCityHall[1].updateMatrixWorld();
                                objectsCityHall[1].rotateOnAxis(new THREE.Vector3(0, 0, 1), piRotation);
                                objectsCityHall[1].updateMatrixWorld();
                            } else if (intersect.object.parent.name == modelsName[2]) {
                                objectsCityHall[0].visible = false;
                                objectsCityHall[1].visible = false;
                                objectsCityHall[2].visible = true;
                                objectsCityHall[2].position.set(x, y, z);
                                const coord = new itowns.Coordinates('EPSG:4978', objectsCityHall[2].position.x, objectsCityHall[2].position.y, objectsCityHall[2].position.z - 3).as('EPSG:4978');
                                // set object position to the coordinate
                                coord.toVector3(objectsCityHall[2].position);
                                // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north..
                                objectsCityHall[2].lookAt(coord.geodesicNormal.clone().add(objectsCityHall[2].position));
                                itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', objectsCityHall[2]);
                                objectsCityHall[2].updateMatrixWorld();
                                objectsCityHall[2].rotateOnAxis(new THREE.Vector3(0, 0, 1), piRotation);
                                objectsCityHall[2].updateMatrixWorld();
                            } else if (intersect.object.name == 'data') {
                                objectsCityHall.forEach((building) => {
                                    building.visible = false;
                                });
                            }
                        });
                        view.notifyChange();
                    }
                }
            };
        }

        function initSunMode() {
            vrControls.onRightButtonPressed = function () {};
            console.log('Buildings mode');
            gnssRotationButton.visible = false;
            buildingsButton.visible = false;
            titleText.visible = false;
            const text = createText('Sun mode : overlay the target on the sun to calibrate the scene', 0.03);
            text.position.set(0.2, 0.2, 0);
            const controllerLeft = vrControls.controllers.filter(controller => controller.name == 'left')[0];
            controllerLeft.add(text);
            const geometry = new THREE.SphereGeometry(15, 32, 16);
            const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.scale.set(0.01, 0.01, 0.01);
            sphere.position.set(0, 0, -5);
            view.scene.add(sphere);
            view.webXR.vrControls.groupXR.children[0].add(sphere);
            const sunPos = view.simulateSun();
            const geometryLine = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 10000)]);
            const materialLine = new THREE.LineBasicMaterial({ color: 0xffff00 });
            const line = new THREE.Line(geometryLine, materialLine);
            line.position.set(vrControls.groupXR.clone().position.x, vrControls.groupXR.clone().position.y, vrControls.groupXR.clone().position.z);
            line.lookAt(sunPos);
            line.updateMatrixWorld();
            view.scene.add(line);
            vrControls.onLeftButtonPressed = function (evt) {
                [line, sphere, text].forEach((obj) => {
                    obj.geometry.dispose();
                    obj.material.dispose();
                    obj.parent.remove(obj);
                });
                view.notifyChange();
                // startDemo();
            };
        }

        function updateGuizmoPosition() {
            const headingRad = THREE.MathUtils.degToRad(rotationGnss.heading);
            const pitchRad = THREE.MathUtils.degToRad(0);
            const groupXR = view.webXR.vrControls.groupXR;
            const vrControls = view.webXR.vrControls;
            const upAxis = groupXR.position.clone().normalize();
            const headingQuaternion = new THREE.Quaternion().setFromAxisAngle(upAxis, headingRad).normalize();
            guizmosGnss.quaternion.copy(headingQuaternion);
            groupXR.updateMatrixWorld();
            const baseOrientation = groupXR.quaternion.clone().normalize();
            const rightAxis = new THREE.Vector3(1, 0, 0).applyQuaternion(baseOrientation).normalize();
            const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(rightAxis, pitchRad).normalize();
            guizmosGnss.quaternion.premultiply(pitchQuaternion);
            groupXR.quaternion.premultiply(pitchQuaternion);
            groupXR.updateMatrixWorld();
            guizmosGnss.updateMatrixWorld();
            view.notifyChange();
        }

        async function rotateWithGNSS() {
            let pos;
            try {
                const response = await fetch('https://10.73.118.16:8082/geopos');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                pos = await response.json();
                if (!pos || pos.longitude === undefined) {
                    throw new Error('No valid GNSS position received');
                }
                // Check for pre-calculated world position
                if (!pos.worldPosition) {
                    throw new Error('World position not provided in GNSS response');
                }
            } catch (e) {
                console.warn('GNSS fetch error:', e);
                return; // Exit gracefully, do not proceed with broken data
            }

            try {
                const headingRad = THREE.MathUtils.degToRad((pos.heading + 270) % 360); // +270 to compensate for helmet rotation
                const pitchRad = THREE.MathUtils.degToRad(pos.pitch);

                console.log('Update guizmo rotation', pos.heading);
                console.log(baseOrientation);

                // let headingRad = THREE.MathUtils.degToRad(rotationGnss.heading);
                const groupXR = view.webXR.vrControls.groupXR;

                // Rz (heading/yaw rotation)
                const Rz = new THREE.Matrix3().setFromMatrix4(
                    new THREE.Matrix4().makeRotationZ(headingRad),
                );

                // Rx (pitch rotation)
                const Rx = new THREE.Matrix3().setFromMatrix4(
                    new THREE.Matrix4().makeRotationX(pitchRad),
                );

                // world baseline from world position
                const worldPos = new THREE.Vector3(pos.worldPosition.x, pos.worldPosition.y, pos.worldPosition.z);
                const bWorldNormalized = worldPos.clone().normalize();

                // Calculate Ry angle from world baseline
                const ryAngle = calculateRyAngleFromWorldBaseline(bWorldNormalized, Rx, Rz);

                // Rz * Ry * Rx
                const Ry = new THREE.Matrix3().setFromMatrix4(
                    new THREE.Matrix4().makeRotationY(ryAngle),
                );

                const RyRx = new THREE.Matrix3().multiplyMatrices(Ry, Rx);
                const RzRyRx = new THREE.Matrix3().multiplyMatrices(Rz, RyRx);

                // Convert to quaternion and apply
                const quaternion = new THREE.Quaternion().setFromRotationMatrix(RzRyRx);

                groupXR.quaternion.copy(baseOrientation);
                groupXR.quaternion.multiplyQuaternions(quaternion, baseOrientation);
                groupXR.updateMatrixWorld();
                view.notifyChange();
            } catch (e) {
                console.warn('Error updating XR state:', e);
                // Optionally, handle or reset only the affected part
            }
        }

        vrControls.onRightButtonReleased = function (evt) {
            console.log('Right controller button pressed event:', evt);
            const buttonIndex = evt.message.buttonIndex;
            if (buttonIndex === 5) { // B button
                console.log('B button pressed on right controller');
                startBuildingsPlannerMode();
            }
            if (buttonIndex === 4) { // A button
                console.log('A button pressed on right controller');
                rotateWithGNSS();
            }
        };

        // vrControls.onRightButtonReleased = function (evt) {
        //     const controllerRight = this.controllers.filter(controller => controller.name == 'right')[0];

        //     let line;
        //     // eslint-disable-next-line no-unused-expressions
        //     controllerRight.children.forEach((element) => { element.isLine ? line = element : console.warn('No line in controler'); });
        //     const raycaster = new THREE.Raycaster();
        //     const pos = new THREE.Vector3();
        //     const dir = new THREE.Vector3();
        //     if (line) {
        //         line.getWorldPosition(pos);
        //         line.getWorldDirection(dir);
        //         raycaster.ray.origin = pos;
        //         raycaster.ray.direction = dir.multiplyScalar(-1);
        //         const intersects = raycaster.intersectObjects(view.scene.children);
        //         if (intersects.length > 0 && intersects[0].object.name == 'buildingsButton') {
        //             // startBuildingsPlannerMode();
        //             view.notifyChange();
        //         } else if (intersects.length > 0 && intersects[0].object.name == 'gnssRotationButton') {
        //             rotateWithGNSS();
        //             view.notifyChange();
        //         }
        //     }
        //     startBuildingsPlannerMode();
        // };

        function setTransparentData(view) {
            function findMeshinChildren(featureMesh) {
                const children = featureMesh.children[0];
                if (children.isMesh) {
                    const material = new THREE.MeshBasicMaterial({ color: children.material.color });
                    material.transparent = true;
                    material.opacity = 0.5;
                    material.blending = THREE.CustomBlending;
                    material.blendEquation = THREE.SubtractEquation;
                    material.blendSrc = THREE.SrcAlphaFactor;
                    material.blendDst = THREE.ZeroFactor;
                    children.material = material;
                } else {
                    findMeshinChildren(children);
                }
            }
            view.renderer.setClearColor(new itowns.THREE.Color(), 0);
            view.tileLayer.opacity = 0;
            const layer = view.getLayers().find(l => l.id === 'WFS Building');
            if (layer) {
                layer.whenReady.then(() => {
                    layer.object3d.children.forEach((featureMesh) => {
                        findMeshinChildren(featureMesh);
                        view.notifyChange();
                    });
                });
            }
            view.notifyChange();
        }

        function updateText(message, text) {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            let metrics = null;
            const textHeight = 100;
            context.font = `normal ${textHeight}px Arial`;
            metrics = context.measureText(message);
            const textWidth = metrics.width;
            canvas.width = textWidth;
            canvas.height = textHeight;
            context.font = `normal ${textHeight}px Arial`;
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillStyle = '#ffffff';
            context.fillText(message, textWidth / 2, textHeight / 2);

            const texture = new THREE.Texture(canvas);
            texture.needsUpdate = true;

            const material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                map: texture,
                transparent: true,
            });

            text.material = material;
            text.geometry.dispose();
            text.geometry = new THREE.PlaneGeometry((0.03 * textWidth) / textHeight, 0.03);
        }

        vrControls.onLeftButtonReleased = function (evt) {
            const buttonIndex = evt.message.buttonIndex;
            if (buttonIndex === 5) { // Y button
                setTransparentData(this.view);
            } else if (buttonIndex === 4) { // X button - Toggle depth occlusion
                const session = evt.frame.session || xr.getSession();
                depthActive = !depthActive;
                toggleDepthSensing(session, depthActive);
                console.log(`Depth occlusion ${depthActive ? 'enabled' : 'disabled'}`);
            } else if (buttonIndex === 1) { // grip button
                const controllerLeft = this.controllers.filter(controller => controller.name == 'left')[0];
                let line;
                // eslint-disable-next-line no-unused-expressions
                controllerLeft.children.forEach((element) => { element.isLine ? line = element : console.warn('No line in controler'); });
                const raycaster = new THREE.Raycaster();
                const pos = new THREE.Vector3();
                const dir = new THREE.Vector3();
                if (line) {
                    line.getWorldPosition(pos);
                    line.getWorldDirection(dir);
                    raycaster.ray.origin = pos;
                    raycaster.ray.direction = dir.multiplyScalar(-1);
                    const intersects = raycaster.intersectObjects(view.scene.children);
                    intersects.forEach((intersect) => {
                        if (intersect.object.layer && intersect.object.layer.isFeatureGeometryLayer) {
                            const batchId = intersect.object.geometry.attributes.batchId.array[intersect.face.a];
                            const feature = intersect.object.feature;
                            const usage = `usage: ${feature.geometries[batchId].properties.usage_1}`;
                            const nature = `nature: ${feature.geometries[batchId].properties.nature}`;
                            const cleabs = `cleabs: ${feature.geometries[batchId].properties.cleabs}`;

                            updateText(usage, usageText);
                            updateText(nature, natureText);
                            updateText(cleabs, cleabsText);
                        }
                    });
                }
            }
        };
    });
}
