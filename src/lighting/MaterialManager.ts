import * as THREE from "three";
import spotlightVertexShader from '../rendering/shaders/spotlight.vert';
import spotlightFragmentShader from '../rendering/shaders/spotlight.frag';
import { SpotlightUniforms } from '../world/config/StageConfig';

export class MaterialManager {
  private billboardMaterial: THREE.ShaderMaterial;
  private wireframeMaterial: THREE.MeshBasicMaterial;

  constructor(spotlightUniforms: SpotlightUniforms) {
    this.createMaterials(spotlightUniforms);
  }

  private createMaterials(uniforms: SpotlightUniforms): void {
    this.billboardMaterial = new THREE.ShaderMaterial({
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

    this.wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });
  }

  public updateUniforms(uniforms: Partial<SpotlightUniforms>): void {
    Object.keys(uniforms).forEach(key => {
      if (this.billboardMaterial.uniforms[key]) {
        this.billboardMaterial.uniforms[key].value = uniforms[key as keyof SpotlightUniforms];
      }
    });
  }

  public cloneBillboardMaterial(): THREE.ShaderMaterial {
    const clonedMaterial = this.billboardMaterial.clone();
    return clonedMaterial;
  }

  public cloneWireframeMaterial(): THREE.MeshBasicMaterial {
    return this.wireframeMaterial.clone();
  }

  public dispose(): void {
    this.billboardMaterial.dispose();
    this.wireframeMaterial.dispose();
  }
}
