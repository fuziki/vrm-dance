import * as THREE from "three";
import { StageConfig } from "../config/StageConfig";
import ledVertexShader from '../../rendering/shaders/led.vert';
import ledFragmentShader from '../../rendering/shaders/led.frag';
import baseVertexShader from '../../rendering/shaders/base.vert';
import baseFragmentShader from '../../rendering/shaders/base.frag';

export class LEDSystem {
  private material: THREE.ShaderMaterial;
  private clock: THREE.Clock;

  constructor(clock: THREE.Clock) {
    this.clock = clock;
    this.createMaterial();
  }

  private createMaterial(): void {
    const uniforms = {
      time: { value: 0 },
      color: { value: StageConfig.LED_UNIFORMS.color.clone() },
      ledCount: { value: StageConfig.LED_UNIFORMS.ledCount },
      speed: { value: StageConfig.LED_UNIFORMS.speed },
      radius: { value: StageConfig.LED_UNIFORMS.radius }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: ledVertexShader,
      fragmentShader: ledFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      lights: false
    });
  }

  private createLEDPlane(width: number, rotation: THREE.Euler, position: THREE.Vector3): THREE.Mesh {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(width * StageConfig.SCALE, 0.015),
      this.material
    );

    plane.rotation.copy(rotation);
    plane.position.copy(position);

    // UV座標調整
    const uvAttribute = plane.geometry.attributes.uv;
    for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i);
      uvAttribute.setX(i, u * width);
    }
    uvAttribute.needsUpdate = true;

    plane.receiveShadow = false;
    return plane;
  }

  private createBasePlane(width: number, rotation: THREE.Euler, position: THREE.Vector3): THREE.Mesh {
    const baseMaterial = new THREE.ShaderMaterial({
      vertexShader: baseVertexShader,
      fragmentShader: baseFragmentShader,
      side: THREE.DoubleSide,
    });

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(width * StageConfig.SCALE, 0.025),
      baseMaterial
    );

    plane.rotation.copy(rotation);
    plane.position.copy(position);
    plane.receiveShadow = false;

    return plane;
  }

  load(scene: THREE.Scene): void {
    const { SCALE, MAIN_EDGE_LENGTH, CORNER_EDGE_LENGTH } = StageConfig;
    const squareSide = CORNER_EDGE_LENGTH * SCALE / Math.sqrt(2) / 2;
    const offset = StageConfig.STAGE_OFFSET;
    const offsetX = MAIN_EDGE_LENGTH * SCALE / 2;

    // LED プレーン設定
    const ledConfigs = [
      {
        width: MAIN_EDGE_LENGTH,
        rotation: new THREE.Euler(0, 0, Math.PI),
        position: new THREE.Vector3(0, -0.02, -offset)
      },
      {
        width: CORNER_EDGE_LENGTH,
        rotation: new THREE.Euler(0, Math.PI / 4 * 3, 0),
        position: new THREE.Vector3(squareSide + offsetX, -0.02, squareSide - offset)
      },
      {
        width: CORNER_EDGE_LENGTH,
        rotation: new THREE.Euler(0, -Math.PI / 4 * 3, 0),
        position: new THREE.Vector3(-squareSide - offsetX, -0.02, squareSide - offset)
      }
    ];

    // LED プレーンとベースプレーンを生成
    ledConfigs.forEach(config => {
      scene.add(this.createLEDPlane(config.width, config.rotation, config.position));
      scene.add(this.createBasePlane(config.width, config.rotation, config.position));
    });
  }

  update(): void {
    if (this.material) {
      this.material.uniforms.time.value = this.clock.getElapsedTime();
    }
  }
}
