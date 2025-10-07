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

export function setupXRCalibrationUI(view, createText, rotationGlobal) {
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
            objectsCityHall[i].scale.set(1, 1, 1);
            view.scene.add(objectsCityHall[i]);
        }
    }

    xr.addEventListener('sessionstart', function () {
        const vrControls = view.webXR.vrControls;
        const scenarioText = ['scenario 1', 'scenario 2', 'scenario 3'];
        // Prepare mesh creation once
        const gnssRotationButton = makeButtonMesh(0.2, 0.1, 0.01, 0xffff00, 'gnssRotationButton', 'Gnss', createText);
        const buildingsButton = makeButtonMesh(0.3, 0.1, 0.01, 0x008000, 'buildingsButton', 'Buildings', createText);
        const titleText = createText('Calibration mode', 0.06);

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
        });

        // Controller 1: add buttons and handle press
        this.getController(1).addEventListener('connected', () => {
            if (this.getController(0).name == 'left') {
                indexLeft = 0; indexRight = 1;
            } else {
                indexLeft = 1; indexRight = 0;
            }
            gnssRotationButton.position.set(-0.15, 0.2, 0);
            buildingsButton.position.set(0.15, 0.2, 0);
            titleText.position.set(0, 0.3, 0);
            [gnssRotationButton, buildingsButton, titleText].forEach((obj) => {
                view.scene.add(obj);
                this.getController(indexLeft).add(obj);
            });
            groupGuizmo.position.set(vrControls.groupXR.clone().position.x, vrControls.groupXR.clone().position.y, vrControls.groupXR.clone().position.z);
            groupGuizmo.updateMatrixWorld();
            guizmosGnss.position.set(vrControls.groupXR.clone().position.x, vrControls.groupXR.clone().position.y + 5.5, vrControls.groupXR.clone().position.z);
            guizmosGnss.updateMatrixWorld();
            updateGuizmoPosition();
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
            titleText.visible = false;

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

                // add building to ground
                buildingsGround[i].visible = true;
                buildingsGround[i].position.set(view.camera.camera3D.position.x  + (i * 2), view.camera.camera3D.position.y + 2, view.camera.camera3D.position.z);
                view.scene.add(buildingsGround[i]);
                const coord = new itowns.Coordinates('EPSG:4978', buildingsGround[i].position.x, buildingsGround[i].position.y, buildingsGround[i].position.z - 3).as('EPSG:4978');
                // set object position to the coordinate
                coord.toVector3(buildingsGround[i].position);
                // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north..
                buildingsGround[i].lookAt(coord.geodesicNormal.clone().add(buildingsGround[i].position));
                itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', buildingsGround[i]);
                buildingsGround[i].updateMatrixWorld();
            });

            vrControls.onRightButtonReleased = function (evt) {
                const controllerRight = this.controllers.filter(controller => controller.name == 'right')[0];
                let line;
                
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
                    intersects.forEach((intersect) => {
                        if (intersect.object.parent.name == modelsName[0]) {
                            objectsCityHall[0].visible = true;
                            objectsCityHall[1].visible = false;
                            objectsCityHall[2].visible = false;
                            objectsCityHall[0].position.set(4533426.888358, -48949.482814, 4471199.344369498);
                            const coord = new itowns.Coordinates('EPSG:4978', objectsCityHall[0].position.x, objectsCityHall[0].position.y, objectsCityHall[0].position.z - 3).as('EPSG:4978');
                            // set object position to the coordinate
                            coord.toVector3(objectsCityHall[0].position);
                            // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north..
                            objectsCityHall[0].lookAt(coord.geodesicNormal.clone().add(objectsCityHall[0].position));
                            itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', objectsCityHall[0]);
                            objectsCityHall[0].updateMatrixWorld();
                        } else if (intersect.object.parent.name == modelsName[1]) {
                            objectsCityHall[0].visible = false;
                            objectsCityHall[1].visible = true;
                            objectsCityHall[2].visible = false;

                            objectsCityHall[1].position.set(4533426.888358, -48949.482814, 4471199.344369498);
                            const coord = new itowns.Coordinates('EPSG:4978', objectsCityHall[1].position.x, objectsCityHall[1].position.y, objectsCityHall[1].position.z - 3).as('EPSG:4978');
                            // set object position to the coordinate
                            coord.toVector3(objectsCityHall[1].position);
                            // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north..
                            objectsCityHall[1].lookAt(coord.geodesicNormal.clone().add(objectsCityHall[1].position));
                            itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', objectsCityHall[1]);
                            objectsCityHall[1].updateMatrixWorld();
                        } else if (intersect.object.parent.name == modelsName[2]) {
                            objectsCityHall[0].visible = false;
                            objectsCityHall[1].visible = false;
                            objectsCityHall[2].visible = true;

                            objectsCityHall[2].position.set(4533426.888358, -48949.482814, 4471199.344369498);
                            const coord = new itowns.Coordinates('EPSG:4978', objectsCityHall[2].position.x, objectsCityHall[2].position.y, objectsCityHall[2].position.z - 3).as('EPSG:4978');
                            // set object position to the coordinate
                            coord.toVector3(objectsCityHall[2].position);
                            // set ENH orientation, looking at the sky (Z axis), so Y axis look to the north..
                            objectsCityHall[2].lookAt(coord.geodesicNormal.clone().add(objectsCityHall[2].position));
                            itowns.DEMUtils.placeObjectOnGround(view.tileLayer, 'EPSG:4978', objectsCityHall[2]);
                            objectsCityHall[2].updateMatrixWorld();
                        }
                    });
                    view.notifyChange();
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
            const headingRad = THREE.MathUtils.degToRad(rotationGlobal.heading);
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
            try {
                const pos = await fetch('http://localhost:8085/').then(r => r.json());
                const headingRad = THREE.MathUtils.degToRad(pos.heading);
                const pitchRad = THREE.MathUtils.degToRad(pos.pitch);
                const groupXR = view.webXR.vrControls.groupXR;
                const vrControls = view.webXR.vrControls;
                const upAxis = new THREE.Vector3(0, -1, 0);
                const headingQuaternion = new THREE.Quaternion().setFromAxisAngle(upAxis, headingRad).normalize();
                groupXR.quaternion.copy(headingQuaternion);
                const baseOrientation = groupXR.quaternion.clone().normalize();
                const rightAxis = new THREE.Vector3(0, 0, 1).applyQuaternion(baseOrientation).normalize();
                const pitchQuaternion = new THREE.Quaternion().setFromAxisAngle(rightAxis, pitchRad).normalize();
                groupXR.quaternion.premultiply(headingQuaternion);
                groupXR.quaternion.premultiply(pitchQuaternion);
                groupXR.updateMatrixWorld();
                guizmosGnss.updateMatrixWorld();
                view.notifyChange();
            } catch (e) {
                console.warn('Geolocation error, using default position.', e);
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
            const controllerRight = this.controllers.filter(controller => controller.name == 'right')[0];
            let line;
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
                if (intersects.length > 0 && intersects[0].object.name == 'buildingsButton') {
                    // startBuildingsPlannerMode();
                    view.notifyChange();
                } else if (intersects.length > 0 && intersects[0].object.name == 'gnssRotationButton') {
                    rotateWithGNSS();
                    view.notifyChange();
                }
            }
            startBuildingsPlannerMode();
        };

        vrControls.onLeftButtonPressed = function (evt) {
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
            this.view.renderer.setClearColor(new itowns.THREE.Color(), 0);
            this.view.tileLayer.opacity = 0;
            const layer = this.view.getLayers().find(l => l.id === 'WFS Building');
            if (layer) {
                layer.whenReady.then(() => {
                    layer.object3d.children.forEach((featureMesh) => {
                        findMeshinChildren(featureMesh);
                        this.view.notifyChange();
                    });
                });
            }
            this.view.notifyChange();
        };
    });
}
