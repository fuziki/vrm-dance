uniform float time;
uniform vec3 color;
varying vec2 vUv;

void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    mvPosition.z += 0.002;
    gl_Position = projectionMatrix * mvPosition;
}
