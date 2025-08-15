uniform sampler2D texBody;
uniform float opacity;

varying vec2 vUv;
varying float vAlpha;
varying float vRandomSeed;

void main() {
    vec4 texColor = texture2D(texBody, vUv);

    // 色オフセットを作成
    vec3 randomOffset = vec3(
        sin(vRandomSeed * 12.9898),
        sin(vRandomSeed * 78.233),
        sin(vRandomSeed * 39.425)
    );
    randomOffset = vec3(1) - randomOffset * 0.05;

    // 色味をわずかに変える
    vec3 color = texColor.rgb * randomOffset;

    gl_FragColor = vec4(color, texColor.a * vAlpha * opacity);
}
