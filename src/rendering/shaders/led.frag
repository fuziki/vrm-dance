uniform float time;
uniform vec3 color;
uniform float ledCount;
uniform float speed;
uniform float radius;

varying vec2 vUv;

float baseIntensity = 0.1;
float waveIntensity = 1.0;

float roundedRectSDF(vec2 p, vec2 size, float radius) {
    vec2 d = abs(p) - size + vec2(radius);
    return length(max(d, 0.0)) - radius;
}

void main() {
    float ledIndex = floor(vUv.x * ledCount);
    float localX = fract(vUv.x * ledCount) - 0.5;
    float localY = vUv.y - 0.5;
    vec2 localPos = vec2(localX, localY) * 2.0;

    float dist = roundedRectSDF(localPos, vec2(0.7, 1), radius);
    float shape = 1.0 - smoothstep(0.0, -0.05, -dist);

    float wavePhase = (ledIndex / ledCount) * 6.28318 - time * speed;
    float wave = (sin(wavePhase) + 1.0) * 0.5;

    float wave2 = (sin(wavePhase * 2.0 + time * speed * 0.5) + 1.0) * 0.5;
    float combinedWave = mix(wave, wave2, 0.3);

    float intensity = shape * (baseIntensity + combinedWave * waveIntensity);

    gl_FragColor = vec4(color * intensity, 1.0);
}
