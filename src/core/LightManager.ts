import * as THREE from "three";

export class LightManager {
  private directionalLight: THREE.DirectionalLight;
  private directionalLight2: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;

  constructor() {
    this.directionalLight = this.createDirectionalLight();
    this.directionalLight2 = this.createDirectionalLight2();
    this.ambientLight = this.createAmbientLight();
  }

  private createDirectionalLight(): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(1, 2.0, -1.0);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 40;
    light.shadow.bias = -0.001;
    return light;
  }

  private createDirectionalLight2(): THREE.DirectionalLight {
    const light = new THREE.DirectionalLight(0xffffff, 1.5);
    light.position.set(-1, 2.0, -1.0);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 40;
    light.shadow.bias = -0.001;
    return light;
  }

  private createAmbientLight(): THREE.AmbientLight {
    return new THREE.AmbientLight(0xffffff, 0.5);
  }

  public load(scene: THREE.Scene) {
    scene.add(this.directionalLight);
    scene.add(this.directionalLight2);
    scene.add(this.ambientLight);
  }
}
