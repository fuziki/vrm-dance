import * as THREE from "three";
import { StageConfig } from "../config/StageConfig";

export class FogLoader {
  private loader: THREE.TextureLoader;

  constructor(loader: THREE.TextureLoader) {
    this.loader = loader;
  }

  async load(scene: THREE.Scene): Promise<void> {
    const texture = await this.loader.loadAsync("./fog.png");
    const radius = StageConfig.FOG_RADIUS;
    const height = Math.PI * radius;

    const geometry = new THREE.CylinderGeometry(
      radius, radius, height,
      64, 1, true,
      -Math.PI / 2, Math.PI
    );

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const halfCylinder = new THREE.Mesh(geometry, material);
    halfCylinder.position.y = radius / 2 - 2.5;

    scene.add(halfCylinder);
  }
}
