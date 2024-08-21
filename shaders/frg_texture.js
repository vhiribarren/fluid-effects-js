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

const FRAGMENT_SHADER_TEXTURE = `
varying vec2 v_uv;
uniform sampler2D uTexture;
void main() {
    vec2 canvas_size = gl_FragCoord.xy / v_uv;
    float canvas_ratio = canvas_size.x / canvas_size.y;
    vec2 uv = v_uv * vec2(canvas_ratio, 1.0); // Cancel screen deformation
    ivec2 texture_size = textureSize(uTexture, 1);
    float texture_ratio = float(texture_size.x)/float(texture_size.y);
    gl_FragColor = texture2D(uTexture, uv*vec2(1.0/texture_ratio, 1.0));
}
`;

export default FRAGMENT_SHADER_TEXTURE;