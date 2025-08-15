attribute float randomSeed;
uniform float time;
uniform float swingFrequency;
uniform float swingOffset;
uniform vec3 customCameraPosition;
varying vec2 vUv;
varying float vAlpha;
varying float vRandomSeed;

// Simplex風ノイズ（-1〜1）
float hash(float n) {
  return fract(sin(n) * 43758.5453);
}
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), u) * 2.0 - 1.0;
}

// スムースステップ
float smoothstepCustom(float edge0, float edge1, float x) {
  float t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

// 線形補間
float lerp(float a, float b, float t) {
  return a + t * (b - a);
}

void main() {
  vUv = uv;
  vRandomSeed = randomSeed;

  // 肩のオフセット
  vec3 originOffset = vec3(0.0, -0.5, 0.0);
  vec3 adjustedPosition = position - originOffset;

  // 振りの位相
  float basePhase = 6.2831 * swingFrequency * time; // 2π * f * t
  float nr1 = randomSeed * 1000.0;
  float phaseNoise = noise(nr1 + time * 0.27);
  float phase = basePhase + phaseNoise;

  // 振りの角度
  float angle = cos(phase);
  float angle_unsmooth = smoothstepCustom(-1.0, 1.0, angle) * 2.0 - 1.0;
  float rand01 = fract(sin(randomSeed * 1.2345) * 43758.5453); // 乱数再現
  angle = lerp(angle, angle_unsmooth, rand01);
  float randMag = 0.3 + fract(sin(randomSeed * 2.3456) * 43758.5453) * 0.7;
  angle *= randMag;

  // 振りの回転軸
  float nr2 = randomSeed * 2000.0;
  float dx = noise(nr2 + time * 0.23 + 100.0);
  vec3 axis = normalize(vec3(dx, 0.0, 1.0));

  // 回転軸で回転する
  float c = cos(angle);
  float s = sin(angle);
  vec3 u = axis;
  mat3 axisRotation = mat3(
    c + u.x*u.x*(1.0 - c), u.x*u.y*(1.0 - c) - u.z*s, u.x*u.z*(1.0 - c) + u.y*s,
    u.y*u.x*(1.0 - c) + u.z*s, c + u.y*u.y*(1.0 - c), u.y*u.z*(1.0 - c) - u.x*s,
    u.z*u.x*(1.0 - c) - u.y*s, u.z*u.y*(1.0 - c) + u.x*s, c + u.z*u.z*(1.0 - c)
  );

  // 肩のオフセット
  float offsetRand = 0.75 + fract(sin(randomSeed * 3.4567) * 43758.5453) * 0.5;
  float offset = swingOffset * offsetRand;

  vec3 rotatedPosition = axisRotation * adjustedPosition;
  rotatedPosition += vec3(0.0, offset, 0.0);
  rotatedPosition += originOffset;

  // インスタンス変換を適用
  vec4 worldPosition = instanceMatrix * vec4(rotatedPosition, 1.0);

  vec3 toCameraXZ = normalize(vec3(
    customCameraPosition.x - worldPosition.x,
    0.0,
    customCameraPosition.z - worldPosition.z
  ));

  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 right = normalize(cross(up, toCameraXZ));
  vec3 forward = cross(right, up);
  mat3 billboardMatrix = mat3(right, up, forward);

  // ビルボード変換
  rotatedPosition = billboardMatrix * rotatedPosition.xyz;
  vec4 finalPosition = instanceMatrix * vec4(rotatedPosition, 1.0);

  // 距離によるアルファ値の計算
  float distanceToCamera = distance(finalPosition.xyz, customCameraPosition);
  vAlpha = smoothstep(60.0, 5.0, distanceToCamera);

  gl_Position = projectionMatrix * viewMatrix * finalPosition;
}
