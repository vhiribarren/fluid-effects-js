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

layout(location = 0) out vec4 outputCoeff;
layout(location = 1) out vec4 outputColor;

uniform float uTimeMs;
uniform sampler2D uInputCoeffs;

float PI = 3.141;
float DOWNCREASE_MIN = 0.005;

vec3 palette_coeff_a = vec3(0.5, 0.5, 0.5);
vec3 palette_coeff_b = vec3(0.5, 0.5, 0.5);
vec3 palette_coeff_c = vec3(1.0, 1.0, 0.5);
vec3 palette_coeff_d = vec3(0.79, 0.88, 0.29);
vec3 color_palette(float val) {
    // From Inigo Quilez - https://www.youtube.com/shorts/TH3OTy5fTog
    return palette_coeff_a + palette_coeff_b*cos(2.0*PI*(val*palette_coeff_c+palette_coeff_d));
}

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
    outputCoeff.r = texelFetch(uInputCoeffs, ivec2(gl_FragCoord.xy), 0).r;
    float leftCoeff =  texelFetch(uInputCoeffs, ivec2(gl_FragCoord.xy) + ivec2(-1, 0), 0).r;
    float rightCoeff = texelFetch(uInputCoeffs, ivec2(gl_FragCoord.xy )+ ivec2(1, 0), 0).r;
    float topCoeff = texelFetch(uInputCoeffs, ivec2(gl_FragCoord.xy) + ivec2(0, 1), 0).r;
    float downCoeff = 0.0;
    if (gl_FragCoord.y < 1.0) {
        downCoeff = average_noise_smoothstep(vec2(gl_FragCoord.x/10.0, uTimeMs/100.0));
    }
    else {
        downCoeff = texelFetch(uInputCoeffs, ivec2(gl_FragCoord.xy) + ivec2(0, -1), 0).r;
    }
    float coeffDelta = 0.1*(5.0*downCoeff + leftCoeff + rightCoeff + topCoeff - 8.0*outputCoeff.r);
    if (coeffDelta < 0.0 && coeffDelta >= -DOWNCREASE_MIN){
        coeffDelta = -DOWNCREASE_MIN;
    } 
    outputCoeff.r += coeffDelta;
    outputColor = vec4(color_palette(outputCoeff.r), 1.0);
}