import * as THREE from "three";
import { SpotLightMaterialManager } from "./MaterialManager";

export class LightUnit {
  private materialManager: SpotLightMaterialManager;
  private geometryTemplate: THREE.PlaneGeometry;
  public group: THREE.Group;
  private singleBeams: THREE.Mesh[] = [];
  private wireframes: THREE.Mesh[] = [];

  constructor(
    materialManager: SpotLightMaterialManager,
    geometryTemplate: THREE.PlaneGeometry,
    lightCount: number,
    radius: number,
    tiltAngle: number
  ) {
    this.materialManager = materialManager;
    this.geometryTemplate = geometryTemplate;
    this.group = new THREE.Group();

    this.createSingleBeams(lightCount, radius, tiltAngle);
  }

  public setUnitTilt(rotation: THREE.Euler): void {
    this.group.rotation.copy(rotation);
  }

  public setUnitPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z);
  }

  private createSingleBeams(
    lightCount: number,
    radius: number,
    tiltAngle: number
  ): void {
    this.clearSingleBeams();

    for (let i = 0; i < lightCount; i++) {
      const angle = (i / lightCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const singleBeam = new THREE.Mesh(
        this.geometryTemplate.clone(),
        this.materialManager.cloneBillboardMaterial()
      );
      singleBeam.position.set(x, 0, z);

      this.applyTilt(singleBeam, x, z, tiltAngle);

      this.group.add(singleBeam);
      this.singleBeams.push(singleBeam);

      const wireframe = new THREE.Mesh(
        this.geometryTemplate.clone(),
        this.materialManager.cloneWireframeMaterial()
      );
      wireframe.position.copy(singleBeam.position);
      wireframe.visible = false;
      this.group.add(wireframe);
      this.wireframes.push(wireframe);
    }
  }

  private applyTilt(
    singleBeam: THREE.Mesh,
    x: number,
    z: number,
    tiltAngle: number
  ): void {
    const tiltRad = (tiltAngle * Math.PI) / 180;
    const tiltDirection = new THREE.Vector3(-x, 0, -z).normalize();
    const tiltAxis = new THREE.Vector3().crossVectors(
      new THREE.Vector3(0, 1, 0),
      tiltDirection
    ).normalize();

    if (Math.abs(tiltAngle) > 0.001) {
      singleBeam.rotateOnAxis(tiltAxis, tiltRad);
    }
  }

  public updateSingleBeamTilt(tiltAngle: number): void {
    this.singleBeams.forEach((singleBeam, index) => {
      singleBeam.rotation.set(0, 0, 0);

      const localPos = singleBeam.position.clone();
      this.applyTilt(singleBeam, localPos.x, localPos.z, tiltAngle);

      if (this.wireframes[index]) {
        this.wireframes[index].rotation.set(0, 0, 0);
        this.applyTilt(this.wireframes[index], localPos.x, localPos.z, tiltAngle);
      }
    });
  }

  public setWireframeVisibility(visible: boolean): void {
    this.wireframes.forEach(wireframe => {
      wireframe.visible = visible;
    });
  }

  public updateGeometry(newGeometry: THREE.PlaneGeometry): void {
    [...this.singleBeams, ...this.wireframes].forEach(mesh => {
      mesh.geometry.dispose();
      mesh.geometry = newGeometry.clone();
    });
  }

  public rotateGroup(speed: number): void {
    this.group.rotateOnAxis(new THREE.Vector3(0, 1, 0), speed);
  }

  public updateMaterialUniforms(uniforms: Record<string, any>): void {
    this.singleBeams.forEach(singleBeam => {
      const material = singleBeam.material as THREE.ShaderMaterial;
      Object.keys(uniforms).forEach(key => {
        if (material.uniforms[key]) {
          material.uniforms[key].value = uniforms[key];
        }
      });
    });
  }

  public updateCameraPosition(cameraPosition: THREE.Vector3): void {
    this.singleBeams.forEach(singleBeam => {
      const material = singleBeam.material as THREE.ShaderMaterial;
      if (material.uniforms.uCameraPosition) {
        material.uniforms.uCameraPosition.value.copy(cameraPosition);
      }
    });
  }

  private clearSingleBeams(): void {
    [...this.singleBeams, ...this.wireframes].forEach(mesh => {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof Array) {
        mesh.material.forEach(mat => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    this.singleBeams = [];
    this.wireframes = [];
  }

  public dispose(): void {
    this.clearSingleBeams();
  }
}
