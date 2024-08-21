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
import FRAGMENT_SHADER_TEXTURE from "./shaders/frg_texture.js";


const params = {
    canvasResolution: 50, // In percentage
    canvasScale: true,
    fpsDisplay: false,
};

const geometry = new THREE.PlaneGeometry(1, 1);
const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER_TEXTURE,
    uniforms: {
        uTexture: { value: new THREE.TextureLoader().load("rustacean-orig-noshadow.png") }
      }
});
const canvas = new THREE.Mesh(geometry, material);
const scene = new THREE.Scene();
scene.add(canvas);

const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({});
document.body.appendChild(renderer.domElement);

const stats = new Stats()
document.body.appendChild(stats.dom)

const applyDisplayParams = () => {
    renderer.setSize(window.innerWidth * params.canvasResolution / 100, window.innerHeight * params.canvasResolution / 100);
    if (params.canvasScale) {
        renderer.domElement.style.cssText = "width: 100%; margin:0; padding: 0";
    }
    stats.dom.hidden = !params.fpsDisplay;
}
applyDisplayParams();

renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
    if (params.fpsDisplay) {
        stats.update();
    }
});

window.addEventListener("resize", (_event) => {
    applyDisplayParams();
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