import * as THREE from "three";
import { StageConfig } from "../config/StageConfig";

export class LiftStage {
  private group: THREE.Group;
  private floor: THREE.Mesh;
  private pillar: THREE.Mesh;

  constructor(stageTexture?: THREE.Texture) {
    this.group = new THREE.Group();
    this.createLiftStage(stageTexture);
  }

  private createLiftStage(stageTexture?: THREE.Texture): void {
    const {
      STAGE_LIFT_SIZE,
      LIFT_STAGE_FLOOR_THICKNESS,
      LIFT_STAGE_PILLAR_HEIGHT,
      LIFT_STAGE_PILLAR_SIZE,
    } = StageConfig;

    // 床部分（穴にピッタリの四角柱）
    const floorGeometry = new THREE.BoxGeometry(
      STAGE_LIFT_SIZE,
      LIFT_STAGE_FLOOR_THICKNESS,
      STAGE_LIFT_SIZE
    );

    const floorMaterial = new THREE.MeshStandardMaterial({
      map: stageTexture || null,
      color: stageTexture ? 0xffffff : 0x8B4513, // テクスチャがある場合は白、ない場合は茶色
      roughness: 0.8,
      metalness: 0.1
    });

    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.position.y = LIFT_STAGE_FLOOR_THICKNESS / 2;
    this.floor.castShadow = true;
    this.floor.receiveShadow = true;
    this.group.add(this.floor);

    // 柱部分（床の中央に立つ細い柱）
    const pillarGeometry = new THREE.BoxGeometry(
      LIFT_STAGE_PILLAR_SIZE,
      LIFT_STAGE_PILLAR_HEIGHT,
      LIFT_STAGE_PILLAR_SIZE
    );

    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x696969, // ダークグレー
      roughness: 0.6,
      metalness: 0.3
    });

    this.pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    // 柱は床の下から伸びる（床の下半分 + 柱の高さの半分だけ下に配置）
    this.pillar.position.y = -LIFT_STAGE_PILLAR_HEIGHT / 2;
    this.pillar.castShadow = true;
    this.pillar.receiveShadow = true;
    this.group.add(this.pillar);
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public setPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z);
  }

  public setHeight(height: number): void {
    this.group.position.y = height;
  }

  public animateUp(targetHeight: number, duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      const startHeight = this.group.position.y;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // イージング関数（ease-out）
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        this.group.position.y = startHeight + (targetHeight - startHeight) * easeProgress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  public animateDown(targetHeight: number, duration: number = 2000): Promise<void> {
    return this.animateUp(targetHeight, duration);
  }

  public dispose(): void {
    this.floor.geometry.dispose();
    // this.floor.material.dispose();
    this.pillar.geometry.dispose();
    // this.pillar.material.dispose();
  }
}
