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

varying vec2 v_uv;
uniform float uTimeMs;
uniform vec2 uScreenSize;
uniform sampler2D uTexture;

float random(vec2 uv) {
  return fract(sin(dot(uv.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float average_noise_smoothstep(vec2 scaled_uv) {
    vec2 percent = smoothstep(vec2(0.), vec2(1.), fract(scaled_uv));
    float rand_tl = random(floor(scaled_uv));
    float rand_tr = random(floor(scaled_uv + vec2(1.0, 0.0)));
    float rand_bl = random(floor(scaled_uv + vec2(0.0, 1.0)));
    float rand_br = random(ceil(scaled_uv));
    float top_avg = mix(rand_tl, rand_tr, percent.x);
    float bottom_avg = mix(rand_bl, rand_br, percent.x);
    return mix(top_avg, bottom_avg, percent.y);
}

void main() {
    gl_FragColor.rgb = texture2D(uTexture, gl_FragCoord.xy/uScreenSize).rgb;
    gl_FragColor.a = 1.0;
    vec3 leftColor = texture2D(uTexture, (gl_FragCoord.xy + vec2(-1.0, 0.0))/uScreenSize).rgb;
    vec3 rightColor = texture2D(uTexture, (gl_FragCoord.xy + vec2(1.0, 0.0))/uScreenSize).rgb;
    vec3 topColor = texture2D(uTexture, (gl_FragCoord.xy + vec2(0.0, 1.0))/uScreenSize).rgb;
    vec3 downColor = vec3(0.0);
    if (gl_FragCoord.y < 1.0) {
        downColor.r = average_noise_smoothstep(vec2(gl_FragCoord.x/10.0, uTimeMs/100.0));
    }
    else {
        downColor = texture2D(uTexture, (gl_FragCoord.xy + vec2(0.0, -1.0))/uScreenSize).rgb;
    }
    vec3 colorDelta = 0.1*(5.0*downColor + leftColor + rightColor + topColor - 8.0*gl_FragColor.rgb);
    float minimum = 0.005;
    if (colorDelta.r >= -minimum && colorDelta.r < 0.0) colorDelta.r = -minimum;
    gl_FragColor.r  +=  colorDelta.r;
}