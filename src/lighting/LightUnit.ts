import * as THREE from "three";
import { SpotLightMaterialManager } from "./MaterialManager";

export class LightUnit {
  private materialManager: SpotLightMaterialManager;
  private geometryTemplate: THREE.PlaneGeometry;
  public group: THREE.Group;
  private beams: THREE.Mesh[] = [];
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

    this.createBeams(lightCount, radius, tiltAngle);
  }

  public setUnitTilt(rotation: THREE.Euler): void {
    this.group.rotation.copy(rotation);
  }

  public setUnitPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z);
  }

  private createBeams(
    lightCount: number,
    radius: number,
    tiltAngle: number
  ): void {
    this.clearBeams();

    for (let i = 0; i < lightCount; i++) {
      const angle = (i / lightCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const beam = new THREE.Mesh(
        this.geometryTemplate.clone(),
        this.materialManager.cloneBillboardMaterial()
      );
      beam.position.set(x, 0, z);

      this.applyTilt(beam, x, z, tiltAngle);

      this.group.add(beam);
      this.beams.push(beam);

      const wireframe = new THREE.Mesh(
        this.geometryTemplate.clone(),
        this.materialManager.cloneWireframeMaterial()
      );
      wireframe.position.copy(beam.position);
      wireframe.visible = false;
      this.group.add(wireframe);
      this.wireframes.push(wireframe);
    }
  }

  private applyTilt(
    beam: THREE.Mesh,
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
      beam.rotateOnAxis(tiltAxis, tiltRad);
    }
  }

  public updateBeamTilt(tiltAngle: number): void {
    this.beams.forEach((beam, index) => {
      beam.rotation.set(0, 0, 0);

      const localPos = beam.position.clone();
      this.applyTilt(beam, localPos.x, localPos.z, tiltAngle);

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
    [...this.beams, ...this.wireframes].forEach(mesh => {
      mesh.geometry.dispose();
      mesh.geometry = newGeometry.clone();
    });
  }

  public rotateGroup(speed: number): void {
    this.group.rotateOnAxis(new THREE.Vector3(0, 1, 0), speed);
  }

  public updateMaterialUniforms(uniforms: Record<string, any>): void {
    this.beams.forEach(beam => {
      const material = beam.material as THREE.ShaderMaterial;
      Object.keys(uniforms).forEach(key => {
        if (material.uniforms[key]) {
          material.uniforms[key].value = uniforms[key];
        }
      });
    });
  }

  public updateCameraPosition(cameraPosition: THREE.Vector3): void {
    this.beams.forEach(beam => {
      const material = beam.material as THREE.ShaderMaterial;
      if (material.uniforms.uCameraPosition) {
        material.uniforms.uCameraPosition.value.copy(cameraPosition);
      }
    });
  }

  private clearBeams(): void {
    [...this.beams, ...this.wireframes].forEach(mesh => {
      this.group.remove(mesh);
      mesh.geometry.dispose();
      if (mesh.material instanceof Array) {
        mesh.material.forEach(mat => mat.dispose());
      } else {
        mesh.material.dispose();
      }
    });
    this.beams = [];
    this.wireframes = [];
  }

  public dispose(): void {
    this.clearBeams();
  }
}
