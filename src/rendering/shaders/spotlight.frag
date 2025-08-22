uniform float uVerticalGain;
uniform float uHorizontalGain;
uniform float uTopWidth;
uniform float uBottomWidth;
uniform float uTopBrightness;
uniform float uNearTopBrightness;
uniform bool uShowUV;
uniform bool uShowVerticalOnly;
uniform bool uShowHorizontalOnly;
varying vec2 vUv;

void main() {
    if (uShowUV) {
        gl_FragColor = vec4(vUv.x, vUv.y, 0.0, 1.0);
        return;
    }

    vec3 lightColor = vec3(0.5, 0.8, 1.0);
    float transition = smoothstep(0.85, 0.95, vUv.y);
    float baseGradient = mix(1.0, uNearTopBrightness, vUv.y / 0.9);
    float topFade = mix(uNearTopBrightness, uTopBrightness, smoothstep(0.9, 1.0, vUv.y));
    float verticalBrightness = mix(baseGradient, topFade, transition);
    verticalBrightness *= uVerticalGain;

    float rectWidth = uTopWidth;
    float virtualWidth = mix(uBottomWidth, uTopWidth, vUv.y);
    float virtualX = (vUv.x - 0.5) * rectWidth;
    float halfVirtualWidth = virtualWidth / 2.0;

    if (abs(virtualX) > halfVirtualWidth) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }

    float distanceFromCenter = abs(virtualX);
    float horizontalBrightness = 1.0 - (distanceFromCenter / halfVirtualWidth);
    horizontalBrightness = max(0.0, horizontalBrightness);
    horizontalBrightness *= uHorizontalGain;

    if (uShowVerticalOnly) {
        vec3 finalColor = lightColor * verticalBrightness;
        gl_FragColor = vec4(finalColor, verticalBrightness * 0.8);
        return;
    }

    if (uShowHorizontalOnly) {
        vec3 finalColor = lightColor * horizontalBrightness;
        gl_FragColor = vec4(finalColor, horizontalBrightness * 0.8);
        return;
    }

    float totalBrightness = verticalBrightness * horizontalBrightness;
    vec3 finalColor = lightColor * totalBrightness;
    gl_FragColor = vec4(finalColor, totalBrightness * 0.8);
}
