uniform vec3 uCameraPosition;
varying vec2 vUv;

void main() {
    vUv = uv;

    vec4 worldPos = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
    
    // LightUnitの回転成分を取得（3x3マトリックス）
    mat3 rotationMatrix = mat3(modelMatrix);
    
    // 元の軸方向（LightUnit回転前）をワールド座標に変換
    vec3 localAxisDirection = vec3(0.0, 1.0, 0.0); // ローカルでの上方向
    vec3 fixedAxis = normalize(rotationMatrix * localAxisDirection);
    
    vec3 cameraToObject = normalize(uCameraPosition - worldPos.xyz);
    vec3 right = normalize(cross(fixedAxis, cameraToObject));
    vec3 forward = normalize(cross(right, fixedAxis));
    
    mat3 billboardMatrix = mat3(right, fixedAxis, forward);
    vec3 billboardPosition = billboardMatrix * position;
    vec3 finalPosition = worldPos.xyz + billboardPosition;

    gl_Position = projectionMatrix * viewMatrix * vec4(finalPosition, 1.0);
}
