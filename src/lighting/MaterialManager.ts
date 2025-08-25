import * as THREE from "three";
import spotlightVertexShader from '../rendering/shaders/spotlight.vert';
import spotlightFragmentShader from '../rendering/shaders/spotlight.frag';
import { SpotlightUniforms } from '../world/config/StageConfig';

export class SpotLightMaterialManager {
  private billboardMaterialTemplate: THREE.ShaderMaterial;
  private wireframeMaterialTemplate: THREE.MeshBasicMaterial;

  constructor(spotlightUniforms: SpotlightUniforms) {
    this.createMaterials(spotlightUniforms);
  }

  private createMaterials(uniforms: SpotlightUniforms): void {
    this.billboardMaterialTemplate = new THREE.ShaderMaterial({
      vertexShader: spotlightVertexShader,
      fragmentShader: spotlightFragmentShader,
      uniforms: {
        uVerticalGain: { value: uniforms.uVerticalGain },
        uHorizontalGain: { value: uniforms.uHorizontalGain },
        uTopWidth: { value: uniforms.uTopWidth },
        uBottomWidth: { value: uniforms.uBottomWidth },
        uTopBrightness: { value: uniforms.uTopBrightness },
        uNearTopBrightness: { value: uniforms.uNearTopBrightness },
        uCameraPosition: { value: new THREE.Vector3() /* 仮の値 */ },
        uShowUV: { value: uniforms.uShowUV },
        uShowVerticalOnly: { value: uniforms.uShowVerticalOnly },
        uShowHorizontalOnly: { value: uniforms.uShowHorizontalOnly }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    this.wireframeMaterialTemplate = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
  }

  public updateUniforms(uniforms: Partial<SpotlightUniforms>): void {
    Object.keys(uniforms).forEach(key => {
      if (this.billboardMaterialTemplate.uniforms[key]) {
        this.billboardMaterialTemplate.uniforms[key].value = uniforms[key as keyof SpotlightUniforms];
      }
    });
  }

  public cloneBillboardMaterial(): THREE.ShaderMaterial {
    const clonedMaterial = this.billboardMaterialTemplate.clone();
    return clonedMaterial;
  }

  public cloneWireframeMaterial(): THREE.MeshBasicMaterial {
    return this.wireframeMaterialTemplate.clone();
  }

  public dispose(): void {
    this.billboardMaterialTemplate.dispose();
    this.wireframeMaterialTemplate.dispose();
  }
}
