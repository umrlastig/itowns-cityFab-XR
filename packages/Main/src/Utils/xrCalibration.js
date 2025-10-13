/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
/* eslint-disable linebreak-style */
// XR Calibration UI logic for iTowns XR Example
import { updateGNSSStatus } from 'Main';
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

export function setupXRCalibrationUI(view, createText, gnssData) {
    const rotationGnss = gnssData.rotation;
    const xr = view.renderer.xr;
    const buildingsHand = [];
    const buildingsGround = [];
    // const buildingRealScale = [];
    const objectsCityHall = [];
    const modelsName = ['LEG-city_hall', 'LEG-city_hall-1', 'LEG-city_hall-2'];

    initBuildingsPlannerMode();

    // Buildings planner
    async function initBuildingsPlannerMode() {
        // ---- Load 3D model ----

        // Object 0
        const mtlLoader = new MTLLoader().setPath('obj/');
        const material0 = await mtlLoader.loadAsync(`${modelsName[0]}.mtl`);
        material0.preload();
        const objLoader = new OBJLoader().setPath('obj/');
        objLoader.setMaterials(material0);
        const object0 = await objLoader.loadAsync(`${modelsName[0]}.obj`);
        object0.position.set(view.camera.camera3D.position.x, view.camera.camera3D.position.y + 60, view.camera.camera3D.position.z + 28);
        itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', object0);
        object0.name = modelsName[0];
        object0.updateMatrixWorld();
        const ambientLight = new THREE.AmbientLight(0x404040, 5); // soft white light
        view.scene.add(ambientLight);
        object0.add(ambientLight);
        objectsCityHall.push(object0);

        // Object 1
        const material1 = await mtlLoader.loadAsync(`${modelsName[1]}.mtl`);
        material1.preload();
        objLoader.setMaterials(material1);
        const object1 = await objLoader.loadAsync(`${modelsName[1]}.obj`);
        object1.position.set(view.camera.camera3D.position.x, view.camera.camera3D.position.y + 60, view.camera.camera3D.position.z + 28);
        itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', object1);
        object1.name = modelsName[1];
        object1.updateMatrixWorld();
        objectsCityHall.push(object1);

        // Object 2
        const material2 = await mtlLoader.loadAsync(`${modelsName[2]}.mtl`);
        material2.preload();
        objLoader.setMaterials(material2);
        const object2 = await objLoader.loadAsync(`${modelsName[2]}.obj`);
        object2.position.set(view.camera.camera3D.position.x, view.camera.camera3D.position.y + 60, view.camera.camera3D.position.z + 28);
        itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', object2);
        object2.name = modelsName[2];
        object2.updateMatrixWorld();
        objectsCityHall.push(object2);


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
            objectsCityHall[i].scale.set(0.8, 0.8, 0.8);
            view.scene.add(objectsCityHall[i]);
        }
    }

    xr.addEventListener('sessionstart', function () {
        const vrControls = view.webXR.vrControls;
        const scenarioText = ['scenario 1', 'scenario 2', 'scenario 3'];
        // Prepare mesh creation once
        const gnssRotationButton = makeButtonMesh(0.2, 0.1, 0.01, 0xffff00, 'gnssRotationButton', 'Gnss', createText);
        const buildingsButton = makeButtonMesh(0.3, 0.1, 0.01, 0x008000, 'buildingsButton', 'Buildings', createText);
        const leftText = createText('Left button to set transparent data', 0.03);
        const rightText = createText('A button for GNSS / B Button for urban planning', 0.03);


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

        // Controller 0: highlight buttons based on pointing
        this.getController(0).addEventListener('connected', () => {
            if (this.getController(0).name == 'left') {
                indexLeft = 0; indexRight = 1;
            } else {
                indexLeft = 1; indexRight = 0;
            }

            rightText.position.set(0, 0.1, 0);
            view.scene.add(rightText);
            this.getController(indexRight).add(rightText);
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
                startDemo();
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
                building.scale.set(0.003, 0.003, 0.003); // make them smaller
                vrControls.controllers[indexLeft].add(building);
                building.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
                building.rotateOnAxis(new THREE.Vector3(1, 0, 0), Math.PI / -2);
                building.updateMatrixWorld();

                const titleText = createText(scenarioText[i], 0.02);
                titleText.position.set(building.position.x, building.position.y - 0.04, building.position.z);
                vrControls.controllers[indexLeft].add(titleText);

                console.log(view.camera.camera3D.position.z);

                // add building to ground
                buildingsGround[i].visible = true;
                buildingsGround[i].position.set(view.camera.camera3D.position.x + (i * 2) - 4, view.camera.camera3D.position.y - 2, view.camera.camera3D.position.z);
                view.scene.add(buildingsGround[i]);
                const coord = new itowns.Coordinates('EPSG:4978', buildingsGround[i].position.x, buildingsGround[i].position.y, buildingsGround[i].position.z - 3).as('EPSG:4978');
                // set object position to the coordinate
                coord.toVector3(buildingsGround[i].position);
                // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north..
                buildingsGround[i].lookAt(coord.geodesicNormal.clone().add(buildingsGround[i].position));
                itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', buildingsGround[i]);
                buildingsGround[i].updateMatrixWorld();

                // buildingsGround[i].rotateOnAxis(new THREE.Vector3(0, 0, 1), Math.PI / 2);
                buildingsGround[i].updateMatrixWorld();
            });

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
                        const x = 4201500.352129;
                        const y = 189933.474110;
                        const z = 4778910.386590208;
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
                startDemo();
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
            } catch (e) {
                console.warn('GNSS fetch error:', e);
                // Optionally, show a message in the UI or reset only what is needed
                return; // Exit gracefully, do not proceed with broken data
            }

            try {
                const headingRad = THREE.MathUtils.degToRad((pos.heading + 270) % 360); // +90 to compensate for helmet rotation
                const pitchRad = THREE.MathUtils.degToRad(pos.pitch);

                console.log('Update guizmo rotation', pos.heading);
                console.log(baseOrientation);

                // let headingRad = THREE.MathUtils.degToRad(rotationGnss.heading);
                const groupXR = view.webXR.vrControls.groupXR;

                // --- Heading rotation ---
                const upAxis = groupXR.position.clone().normalize().multiplyScalar(-1); // Assuming the up direction is -position vector
                // Create a quaternion representing a heading rotation about the up axis.
                const headingQuaternion = new THREE.Quaternion()
                    .setFromAxisAngle(upAxis, headingRad)
                    .normalize();

                groupGuizmo.quaternion.copy(baseOrientation);
                const buffer = baseOrientation.clone().premultiply(headingQuaternion);
                guizmosGnss.quaternion.copy(buffer);
                groupXR.quaternion.copy(guizmosGnss.quaternion.clone());

                guizmosGnss.updateMatrixWorld();
                groupGuizmo.updateMatrixWorld();

                // --- Pitch rotation ---
                // (Assuming (0, 0, 1) is the right direction in local space.)
                const rightAxis = new THREE.Vector3(0, 0, 1)
                    .applyQuaternion(baseOrientation)
                    .normalize();

                // Create a quaternion representing a pitch rotation about the right axis.
                const pitchQuaternion = new THREE.Quaternion()
                    .setFromAxisAngle(rightAxis, pitchRad)
                    .normalize();

                // groupXR.quaternion.premultiply(headingQuaternion);
                // groupXR.quaternion.premultiply(pitchQuaternion);
                // groupXR.quaternion.setFromAxisAngle(rightAxis, pitchRad);

                groupXR.updateMatrixWorld();
                view.notifyChange();
            } catch (e) {
                console.warn('Error updating XR state:', e);
                // Optionally, handle or reset only the affected part
            }
        }

        function startDemo() {
            vrControls.onLeftAxisChanged = function () {};
            vrControls.onRightAxisChanged = function () {};
            vrControls.onLeftButtonPressed = function () {};
            const text = createText('Demonstration session', 0.03);
            text.position.set(0.2, 0.2, 0);
            view.webXR.vrControls.controllers[1].add(text);
            console.log('Begin demo');
            // vrControls.onRightButtonPressed = function () {
            //     let line;
            //     const controllerRight = this.getController(0);
            //     controllerRight.children.forEach((element) => {
            //         if (element.isLine) {
            //             line = element;
            //         }
            //     });
            //     const raycaster = new itowns.THREE.Raycaster();
            //     const pos = new itowns.THREE.Vector3();
            //     const dir = new itowns.THREE.Vector3();
            //     if (line) {
            //         line.getWorldPosition(pos);
            //         line.getWorldDirection(dir);
            //         raycaster.ray.origin = pos;
            //         raycaster.ray.direction = dir.multiplyScalar(-1);
            //         const intersects = raycaster.intersectObjects(view.scene.children);
            //         if (intersects.length > 0 && intersects[0].object.name == 'WFS Building') {
            //             // You can add displayProperties logic here if needed
            //         }
            //     }
            // };
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

        vrControls.onLeftButtonPressed = function (evt) {
            console.log('Left controller button pressed event:', evt);
            const buttonIndex = evt.message.buttonIndex;
            if (buttonIndex === 5) { // Y button
                console.log('Y button pressed on left controller');
                setTransparentData(this.view);
            }
        };
    });
}
