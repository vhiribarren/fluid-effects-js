/*
MIT License

Copyright (c) 2024 Vincent Hiribarren

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { Pane } from "tweakpane";
import VERTEX_SHADER from "./shaders/vtx_default.js";
import FRAGMENT_SHADER_INC_COLOR from "./shaders/frg_inc_color.js";

// Global parameters managed by Tweakpane
const params = {
    canvasResolution: 50, // In percentage
    canvasScale: true,
    fpsDisplay: false,
};

// Base time to pass time delta as uniform to shaders
const baseTime = Date.now();

// Common Three.js elements
const canvasGeometry = new THREE.PlaneGeometry(1, 1);
const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
camera.position.z = 1;
const renderer = new THREE.WebGLRenderer({});
renderer.setClearAlpha(0.0); // Canvas is transparent by default
document.body.appendChild(renderer.domElement);

// To display FPS statistics
const stats = new Stats()
document.body.appendChild(stats.dom);

// Step 1 rendering
let inputRenderTarget = new THREE.WebGLRenderTarget();
let outputRenderTarget = new THREE.WebGLRenderTarget();
const materialStep1 = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER_INC_COLOR,
    uniforms: {
        uTexture: { value: inputRenderTarget.texture },
        uTime: { value: 0.0 },
    }
});
const sceneStep1 = new THREE.Scene();
sceneStep1.add(new THREE.Mesh(canvasGeometry, materialStep1));

// Final rendering of texture
const materialFinal = new THREE.MeshBasicMaterial({ map: outputRenderTarget.texture });
materialFinal.transparent = true;
const sceneFinal = new THREE.Scene();
sceneFinal.add(new THREE.Mesh(canvasGeometry, materialFinal));

// Helpers to switch back and front drawing buffers
const switchStep1RenderTargets = () => {
    [inputRenderTarget, outputRenderTarget] = [outputRenderTarget, inputRenderTarget];
    materialStep1.uniforms.uTexture.value = inputRenderTarget.texture;
    materialFinal.map = outputRenderTarget.texture;
}

// Configure elements depending on window and Tweakpane
const applyDisplayParams = () => {
    const newWidth = window.innerWidth * params.canvasResolution / 100;
    const newHeight = window.innerHeight * params.canvasResolution / 100;
    inputRenderTarget.setSize(newWidth, newHeight);
    outputRenderTarget.setSize(newWidth, newHeight);
    renderer.setSize(newWidth, newHeight);
    if (params.canvasScale) {
        renderer.domElement.style.cssText = "width: 100%; margin:0; padding: 0;  image-rendering: pixelated";
    }
    stats.dom.hidden = !params.fpsDisplay;
}
applyDisplayParams();

// Rendering
renderer.setAnimationLoop(() => {
    materialStep1.uniforms.uTime.value = Date.now() - baseTime;
    renderer.setRenderTarget(outputRenderTarget);
    renderer.render(sceneStep1, camera);
    renderer.setRenderTarget(null);
    renderer.render(sceneFinal, camera);
    switchStep1RenderTargets();
    if (params.fpsDisplay) {
        stats.update();
    }
});

window.addEventListener("resize", (_event) => {
    //Disabled for now
    //applyDisplayParams();
});


// Configure Tweakpane
//////////////////////

const pane = new Pane({
    title: "Parameters",
    expanded: true,
});

const displayFolder = pane.addFolder({
    title: "Display",
    expanded: true,
});

displayFolder
    .addBinding(params, "canvasResolution", {
        label: "Resolution",
        step: 1,
        min: 1,
        max: 100,
        format: (v) => v + " %",
    })
    .on("change", (_ev) => {
        applyDisplayParams();
    });
displayFolder
    .addBinding(params, "canvasScale", { label: "Full screen" })
    .on("change", (_ev) => {
        applyDisplayParams();
    });
displayFolder
    .addBinding(params, "fpsDisplay", { label: "Display FPS" })
    .on("change", (_ev) => {
        applyDisplayParams();
    });