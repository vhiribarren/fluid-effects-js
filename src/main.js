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
import * as TweakpaneEssentialsPlugin from "tweakpane/plugin-essentials";
import { textFileLoader } from "./utils.js";

const FShaderFireBasic = await textFileLoader("./shaders/frg_fire_basic.glsl");

// Global parameters managed by Tweakpane
const params = {
    canvasResolution: 50, // In percentage
    canvasScale: true,
    canvasSmooth: false,
    fpsDisplay: false,
    paletteLuminosity: { x: 1.0, y: 1.0, z: 0.1 },
    paletteContrast: { x: 1.0, y: 1.0, z: 1.0 },
    paletteFreq: { x: 2.0, y: 0.5, z: 0.5 },
    palettePhase: { x: 0.5, y: 0.5, z: 0.5 },
    transparentRange: {min: 0.8, max: 1.0},
    backgroundColor:  {r: 0, g: 0, b: 0, a: 1.0},
    animRun: true,
    verticalForce: 5.0,
    dissipationMinimum: 0.01,
    diffusionCoeff: 6,
};

// Common Three.js elements
const canvasGeometry = new THREE.PlaneGeometry(1, 1);
const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
camera.position.z = 1;
const renderer = new THREE.WebGLRenderer({});
document.body.appendChild(renderer.domElement);

// To display FPS statistics
const stats = new Stats()
document.body.appendChild(stats.dom);

// Step 1 rendering
let inputRenderTarget = new THREE.WebGLRenderTarget(undefined, undefined, { count: 2 });
let outputRenderTarget = new THREE.WebGLRenderTarget(undefined, undefined, { count: 2 }); // channel 0 -> coefficients, channel 1 -> colors to display
const materialStep1 = new THREE.ShaderMaterial({
    fragmentShader: FShaderFireBasic,
    glslVersion: THREE.GLSL3,
    uniforms: {
        uInputCoeffs: { value: inputRenderTarget.textures[0] },
        uTimeAccMs: { value: 0.0 },
        uTimeDeltaMs: { value: 0.0 },
        uPlay: { value: true },
        uVerticalForce: { value: 0.0 },
        uDissipationMinimum:  { value: 0.0 },
        uDiffusionCoeff: { value: 0.0 },
        uPaletteLuminosity: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
        uPaletteContrast: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
        uPaletteFreq: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
        uPalettePhase: { value: new THREE.Vector3(0.0, 0.0, 0.0) },
        uTransparentSmoothMin: { value: 0.0 },
        uTransparentSmoothMax: { value: 0.0 },
    }
});
const sceneStep1 = new THREE.Scene();
sceneStep1.add(new THREE.Mesh(canvasGeometry, materialStep1));

// Final rendering of texture
const materialFinal = new THREE.MeshBasicMaterial({ map: outputRenderTarget.textures[1] });
materialFinal.transparent = true;
const sceneFinal = new THREE.Scene();
sceneFinal.add(new THREE.Mesh(canvasGeometry, materialFinal));

// Helpers to switch back and front drawing buffers
const switchStep1RenderTargets = () => {
    [inputRenderTarget, outputRenderTarget] = [outputRenderTarget, inputRenderTarget];
    materialStep1.uniforms.uInputCoeffs.value = inputRenderTarget.textures[0];
    materialFinal.map = outputRenderTarget.textures[1];
}

// Configure elements depending on window and Tweakpane
const applyDisplayParams = () => {
    const paramPoint3ToVector3 = (paramPoint3Val) => new THREE.Vector3(
        paramPoint3Val.x, paramPoint3Val.y, paramPoint3Val.z
    );
    const newWidth = window.innerWidth * params.canvasResolution / 100;
    const newHeight = window.innerHeight * params.canvasResolution / 100;
    inputRenderTarget.setSize(newWidth, newHeight);
    outputRenderTarget.setSize(newWidth, newHeight);
    renderer.setSize(newWidth, newHeight);
    if (params.canvasScale) {
        renderer.domElement.style.cssText = "width: 100%; margin:0; padding: 0;";
        if (!params.canvasSmooth) {
            renderer.domElement.style.cssText += "image-rendering: pixelated"
        }
    }
    stats.dom.hidden = !params.fpsDisplay;
    materialStep1.uniforms.uPaletteLuminosity.value = paramPoint3ToVector3(params.paletteLuminosity);
    materialStep1.uniforms.uPaletteContrast.value = paramPoint3ToVector3(params.paletteContrast);
    materialStep1.uniforms.uPaletteFreq.value = paramPoint3ToVector3(params.paletteFreq);
    materialStep1.uniforms.uPalettePhase.value = paramPoint3ToVector3(params.palettePhase);
    materialStep1.uniforms.uTransparentSmoothMin.value = params.transparentRange.min;
    materialStep1.uniforms.uTransparentSmoothMax.value = params.transparentRange.max;
    materialStep1.uniforms.uVerticalForce.value = params.verticalForce;
    materialStep1.uniforms.uDissipationMinimum.value = params.dissipationMinimum;
    materialStep1.uniforms.uDiffusionCoeff.value = params.diffusionCoeff;
    renderer.autoClear = true;
    renderer.setClearColor(new THREE.Color(params.backgroundColor.r, params.backgroundColor.g, params.backgroundColor.b), params.backgroundColor.a);
}
applyDisplayParams();

// Rendering
let timeAcc = 0;
let timeDatePrev =  Date.now();
renderer.setAnimationLoop(() => {
    const timeDateCurrent = Date.now();
    const timeDelta = params.animRun ? timeDateCurrent - timeDatePrev : 0.0;
    timeAcc += timeDelta;
    timeDatePrev = timeDateCurrent
    materialStep1.uniforms.uTimeAccMs.value = timeAcc;
    materialStep1.uniforms.uTimeDeltaMs.value = timeDelta;
    materialStep1.uniforms.uPlay.value = params.animRun;
    renderer.setRenderTarget(outputRenderTarget);
    renderer.render(sceneStep1, camera);
    renderer.setRenderTarget(null);
    renderer.render(sceneFinal, camera)
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
pane.registerPlugin(TweakpaneEssentialsPlugin);
pane.on("change", (_ev) => {
    applyDisplayParams();
});

const displayFolder = pane.addFolder({
    title: "Display",
    expanded: true,
});
displayFolder.addBinding(params, "canvasResolution", {
    label: "Resolution",
    step: 1,
    min: 1,
    max: 100,
    format: (v) => v + " %",
});
displayFolder.addBinding(params, "canvasScale", { label: "Full screen" });
displayFolder.addBinding(params, "canvasSmooth", { label: "Canvas Smooth" });
displayFolder.addBinding(params, "fpsDisplay", { label: "Display FPS" });

const colorPaletteFolder = pane.addFolder({
    title: "Color Palette",
    expanded: true,
})
colorPaletteFolder.addBinding(params, "paletteLuminosity", {
    label: "Luminosity",
    x: { min: 0, max: 1 },
    y: { min: 0, max: 1 },
    z: { min: 0, max: 1 },
});
colorPaletteFolder.addBinding(params, "paletteContrast", {
    label: "Contrast",
    x: { min: 0, max: 1 },
    y: { min: 0, max: 1 },
    z: { min: 0, max: 1 },
});
colorPaletteFolder.addBinding(params, "paletteFreq", {
    label: "Frequence",
    x: { min: 0, max: 100 },
    y: { min: 0, max: 100 },
    z: { min: 0, max: 100 },
});
colorPaletteFolder.addBinding(params, "palettePhase", {
    label: "Phase",
    x: { min: 0, max: 1 },
    y: { min: 0, max: 1 },
    z: { min: 0, max: 1 },
});
colorPaletteFolder.addBinding(params, "transparentRange", {
    label: "Transparent Range",
    min: 0.0,
    max: 1.0,
});
colorPaletteFolder.addBinding(params, "backgroundColor", {
    label: "Background Color",
    picker: 'inline',
    color: {type: "float", alpha: true},
});

const fireFolder = pane.addFolder({
    title: "Fire Params",
    expanded: true,
});
fireFolder.addBinding(params, "diffusionCoeff", { label: "Diffusion Coeff", min: 0.0 });
fireFolder.addBinding(params, "verticalForce", { label: "Vertical Force", min: 1.0 });
fireFolder.addBinding(params, "dissipationMinimum", { label: "Dissipation Minimum", min: 0.0, max: 0.1, step: 0.001 });

const animationFolder = pane.addFolder({
    title: "Animation",
    expanded: true,
});
animationFolder.addBinding(params, "animRun", { label: "Run Animation" });
