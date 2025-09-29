/* eslint-disable no-undef */
/* eslint-disable linebreak-style */
// XR Calibration UI logic for iTowns XR Example

function makeButtonMesh(x, y, z, color, name, label, createText) {
    const geometry = new itowns.THREE.BoxGeometry(x, y, z);
    const material = new itowns.THREE.MeshBasicMaterial({ color });
    const mesh = new itowns.THREE.Mesh(geometry, material);
    mesh.name = name;
    if (label && createText) {
        const textObj = createText(label, 0.06);
        textObj.position.set(0, 0, 0.0051);
        textObj.name = name;
        mesh.add(textObj);
    }
    return mesh;
}

function setupXRCalibrationUI(view, createText, rotationGlobal) {
    const xr = view.renderer.xr;
    xr.addEventListener('sessionstart', function () {
        const vrControls = view.webXR.vrControls;
        let called = false;

        // Prepare mesh creation once
        const gnssRotationButton = makeButtonMesh(0.2, 0.1, 0.01, 0xffff00, 'gnssRotationButton', 'Gnss', createText);
        const buildingsButton = makeButtonMesh(0.3, 0.1, 0.01, 0x008000, 'buildingsButton', 'Buildings', createText);
        const titleText = createText('Calibration mode', 0.06);

        // prepare guizmos
        const groupGuizmo = new itowns.THREE.Group();
        const geometryLineX = new itowns.THREE.BufferGeometry().setFromPoints([new itowns.THREE.Vector3(0, 0, 0), new itowns.THREE.Vector3(5, 0, 0)]);
        const geometryLineY = new itowns.THREE.BufferGeometry().setFromPoints([new itowns.THREE.Vector3(0, 0, 0), new itowns.THREE.Vector3(0, 5, 0)]);
        const geometryLineZ = new itowns.THREE.BufferGeometry().setFromPoints([new itowns.THREE.Vector3(0, 0, 0), new itowns.THREE.Vector3(0, 0, 5)]);
        const materialLine = new itowns.THREE.LineBasicMaterial({ color: 0xFF0000 });
        const materialLineY = new itowns.THREE.LineBasicMaterial({ color: 0x00FF00 });
        const materialLineZ = new itowns.THREE.LineBasicMaterial({ color: 0x0000FF });
        const lineX = new itowns.THREE.Line(geometryLineX, materialLine);
        const lineY = new itowns.THREE.Line(geometryLineY, materialLineY);
        const lineZ = new itowns.THREE.Line(geometryLineZ, materialLineZ);
        groupGuizmo.add(lineX);
        groupGuizmo.add(lineY);
        groupGuizmo.add(lineZ);
        view.scene.add(groupGuizmo);
        const guizmosGnss = groupGuizmo.clone();
        view.scene.add(guizmosGnss);

        // Controller 0: highlight buttons based on pointing
        this.getController(0).addEventListener('connected', () => {
            let indexRight; let
                indexLeft;
            if (this.getController(0).name == 'left') {
                indexLeft = 0; indexRight = 1;
            } else {
                indexLeft = 1; indexRight = 0;
            }

            const controllerRight = this.getController(indexRight);
            function highlightButton() {
                let line;
                controllerRight.children.forEach((element) => {
                    if (element.isLine) {
                        line = element;
                    }
                });
                const raycaster = new itowns.THREE.Raycaster();
                const pos = new itowns.THREE.Vector3();
                const dir = new itowns.THREE.Vector3();
                if (line) {
                    line.getWorldPosition(pos);
                    line.getWorldDirection(dir);
                    raycaster.ray.origin = pos;
                    raycaster.ray.direction = dir.multiplyScalar(-1);
                    const intersects = raycaster.intersectObjects(view.scene.children);
                    if (intersects.length > 0 && intersects[0].object.name == 'buildingsButton') {
                        buildingsButton.material = new itowns.THREE.MeshBasicMaterial({ color: 0x025C02 });
                    }  else if (intersects.length > 0 && intersects[0].object.name == 'gnssRotationButton') {
                        gnssRotationButton.material = new itowns.THREE.MeshBasicMaterial({ color: 0xC9C904 });
                    } else {
                        buildingsButton.material = new itowns.THREE.MeshBasicMaterial({ color: 0x008000 });
                        gnssRotationButton.material = new itowns.THREE.MeshBasicMaterial({ color: 0xffff00 });
                    }
                    view.notifyChange();
                }
            }
            // view.addFrameRequester(itowns.MAIN_LOOP_EVENTS.BEFORE_RENDER, highlightButton);
        });

        // Controller 1: add buttons and handle press
        this.getController(1).addEventListener('connected', () => {
            let indexRight; let
                indexLeft;
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
            const geometry = new itowns.THREE.SphereGeometry(15, 32, 16);
            const material = new itowns.THREE.MeshBasicMaterial({ color: 0xffff00 });
            const sphere = new itowns.THREE.Mesh(geometry, material);
            sphere.scale.set(0.01, 0.01, 0.01);
            sphere.position.set(0, 0, -5);
            view.scene.add(sphere);
            view.webXR.vrControls.groupXR.children[0].add(sphere);
            const sunPos = view.simulateSun();
            const geometryLine = new itowns.THREE.BufferGeometry().setFromPoints([new itowns.THREE.Vector3(0, 0, 0), new itowns.THREE.Vector3(0, 0, 10000)]);
            const materialLine = new itowns.THREE.LineBasicMaterial({ color: 0xffff00 });
            const line = new itowns.THREE.Line(geometryLine, materialLine);
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
            const headingRad = itowns.THREE.MathUtils.degToRad(rotationGlobal.heading);
            const pitchRad = itowns.THREE.MathUtils.degToRad(0);
            const groupXR = view.webXR.vrControls.groupXR;
            const vrControls = view.webXR.vrControls;
            const upAxis = groupXR.position.clone().normalize();
            const headingQuaternion = new itowns.THREE.Quaternion().setFromAxisAngle(upAxis, headingRad).normalize();
            guizmosGnss.quaternion.copy(headingQuaternion);
            groupXR.updateMatrixWorld();
            const baseOrientation = groupXR.quaternion.clone().normalize();
            const rightAxis = new itowns.THREE.Vector3(1, 0, 0).applyQuaternion(baseOrientation).normalize();
            const pitchQuaternion = new itowns.THREE.Quaternion().setFromAxisAngle(rightAxis, pitchRad).normalize();
            guizmosGnss.quaternion.premultiply(pitchQuaternion);
            groupXR.quaternion.premultiply(pitchQuaternion);
            groupXR.updateMatrixWorld();
            guizmosGnss.updateMatrixWorld();
            view.notifyChange();
        }

        async function rotateWithGNSS() {
            if (called) { return; }
            called = true;
            try {
                const pos = await fetch('https://localhost:8081/geopos/').then(r => r.json());
                const headingRad = itowns.THREE.MathUtils.degToRad(pos.heading);
                const pitchRad = itowns.THREE.MathUtils.degToRad(pos.pitch);
                const groupXR = view.webXR.vrControls.groupXR;
                const vrControls = view.webXR.vrControls;
                const upAxis = new itowns.THREE.Vector3(0, -1, 0);
                const headingQuaternion = new itowns.THREE.Quaternion().setFromAxisAngle(upAxis, headingRad).normalize();
                groupXR.quaternion.copy(headingQuaternion);
                const baseOrientation = groupXR.quaternion.clone().normalize();
                const rightAxis = new itowns.THREE.Vector3(0, 0, 1).applyQuaternion(baseOrientation).normalize();
                const pitchQuaternion = new itowns.THREE.Quaternion().setFromAxisAngle(rightAxis, pitchRad).normalize();
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
            vrControls.onRightButtonPressed = function () {
                let line;
                const controllerRight = this.getController(0);
                controllerRight.children.forEach((element) => {
                    if (element.isLine) {
                        line = element;
                    }
                });
                const raycaster = new itowns.THREE.Raycaster();
                const pos = new itowns.THREE.Vector3();
                const dir = new itowns.THREE.Vector3();
                if (line) {
                    line.getWorldPosition(pos);
                    line.getWorldDirection(dir);
                    raycaster.ray.origin = pos;
                    raycaster.ray.direction = dir.multiplyScalar(-1);
                    const intersects = raycaster.intersectObjects(view.scene.children);
                    if (intersects.length > 0 && intersects[0].object.name == 'WFS Building') {
                        // You can add displayProperties logic here if needed
                    }
                }
            };
        }

        vrControls.onRightButtonPressed = function (evt) {
            called = false;
            const controllerRight = this.controllers.filter(controller => controller.name == 'right')[0];
            let line;
            controllerRight.children.forEach((element) => { element.isLine ? line = element : console.warn('No line in controler'); });
            const raycaster = new itowns.THREE.Raycaster();
            const pos = new itowns.THREE.Vector3();
            const dir = new itowns.THREE.Vector3();
            if (line) {
                line.getWorldPosition(pos);
                line.getWorldDirection(dir);
                raycaster.ray.origin = pos;
                raycaster.ray.direction = dir.multiplyScalar(-1);
                const intersects = raycaster.intersectObjects(view.scene.children);
                if (intersects.length > 0 && intersects[0].object.name == 'buildingsButton') {
                    initBuildingsMode();
                    view.notifyChange();
                } else if (intersects.length > 0 && intersects[0].object.name == 'gnssRotationButton') {
                    called = false;
                    rotateWithGNSS();
                    view.notifyChange();
                }
            }
        };

        vrControls.onLeftButtonPressed = function (evt) {
            function findMeshinChildren(featureMesh) {
                const children = featureMesh.children[0];
                if (children.isMesh) {
                    const material = new itowns.THREE.MeshBasicMaterial({ color: children.material.color });
                    material.transparent = true;
                    material.opacity = 0.5;
                    material.blending = itowns.THREE.CustomBlending;
                    material.blendEquation = itowns.THREE.SubtractEquation;
                    material.blendSrc = itowns.THREE.SrcAlphaFactor;
                    material.blendDst = itowns.THREE.ZeroFactor;
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
