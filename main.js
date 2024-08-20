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

import * as THREE from 'three';

const VERTEX_SHADER = `
    varying vec2 v_uv;
    void main() {
        v_uv = uv;
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;
    }
`;

const FRAGMENT_SHADER = `
varying vec2 v_uv;

const float PI = 3.14;

vec3 hsl2rgb(float hue, float saturation, float lightness) {
    // From https://en.wikipedia.org/wiki/HSL_and_HSV
    float c = (1.0 - abs(2.0 * lightness - 1.0)) * saturation;
    float hp = hue * 6.0;
    float x = c * (1.0 - abs(mod(hp, 2.0) - 1.0));
    vec3 rgb1;
    if (hp < 1.0) {
        rgb1 = vec3(c, x, 0.0);
    } else if (hp < 2.0) {
        rgb1 = vec3(x, c, 0.0);
    } else if (hp < 3.0) {
        rgb1 = vec3(0.0, c, x);
    } else if (hp < 4.0) {
        rgb1 = vec3(0.0, x, c);
    } else if (hp < 5.0) {
        rgb1 = vec3(x, 0.0, c);
    } else {
        rgb1 = vec3(c, 0.0, x);
    }
    float m = lightness - c/2.0;
    return rgb1 + m;
}

void main() {
    vec2 canvas_size = gl_FragCoord.xy / v_uv;
    float canvas_ratio = canvas_size.x / canvas_size.y;
    vec2 uv = (v_uv - 0.5);  // Put origin at center
    uv *= 2.0; // zoom out to have -1,1 for y axis
    uv *= vec2(canvas_ratio, 1.0); // Cancel screen deformation

    float angle = atan(uv.y, uv.x); // [-PI, PI]
    float hue = angle / (2.0*PI) + 0.5; // [0, 1]]
    float lightness = 0.5;//(1.0-length(uv));
    vec3 color = hsl2rgb(hue, 1.0, lightness);

    gl_FragColor = vec4(color, 1.0);
}
`;

const width = window.innerWidth;
const height = window.innerHeight;

const camera = new THREE.OrthographicCamera(width / -2, width / 2, height / 2, height / -2, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.PlaneGeometry( width, height );
const material = new THREE.ShaderMaterial({vertexShader: VERTEX_SHADER, fragmentShader: FRAGMENT_SHADER});
const canvas = new THREE.Mesh( geometry, material );

const scene = new THREE.Scene();
scene.add( canvas );

renderer.setAnimationLoop( () => renderer.render( scene, camera ) );