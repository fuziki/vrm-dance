import * as THREE from "three";
import { StageConfig } from "../config/StageConfig";
import { OctagonalGeometryUtils } from "../../util/OctagonalGeometryUtils";
import { LiftStage } from "./LiftStage";

export class StageLoader {
  private loader: THREE.TextureLoader;
  private liftStage: LiftStage | null = null;

  constructor(loader: THREE.TextureLoader) {
    this.loader = loader;
  }

  createOctagonalPrism(
    l1: number,
    l2: number,
    scale: number,
    topTexture: THREE.Texture,
    sideTexture: THREE.Texture,
    liftEnabled: boolean = false,
    liftSize: number = 0
  ): THREE.Group {
    const group = new THREE.Group();
    const height = scale;

    const { topVertices, bottomVertices, squareSide } = OctagonalGeometryUtils.createOctagonalVertices(
      l1, l2, scale, height
    );

    if (liftEnabled && liftSize > 0) {
      // Stage lift用の中空八角形を作成
      const topGeometry = OctagonalGeometryUtils.createHollowOctagonalTopGeometry(
        topVertices, squareSide, height, liftSize
      );
      const topMaterial = new THREE.MeshStandardMaterial({
        map: topTexture,
        side: THREE.DoubleSide
      });

      const topMesh = new THREE.Mesh(topGeometry, topMaterial);
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);

      // Stage lift用の中空側面
      const sideGeometry = OctagonalGeometryUtils.createHollowOctagonalSideGeometry(
        topVertices, bottomVertices, l1, l2, scale, liftSize, height
      );

      const clonedSideTexture = sideTexture.clone();
      clonedSideTexture.wrapS = THREE.RepeatWrapping;
      clonedSideTexture.wrapT = THREE.RepeatWrapping;

      const sideMaterial = new THREE.MeshStandardMaterial({
        map: clonedSideTexture,
        side: THREE.DoubleSide
      });

      const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
      sideMesh.castShadow = true;
      sideMesh.receiveShadow = true;
      group.add(sideMesh);
    } else {
      // 通常の八角形を作成（既存の処理）
      const topGeometry = OctagonalGeometryUtils.createOctagonalTopGeometry(topVertices, squareSide, height);
      const topMaterial = new THREE.MeshStandardMaterial({
        map: topTexture,
        side: THREE.DoubleSide
      });

      const topMesh = new THREE.Mesh(topGeometry, topMaterial);
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);

      const sideGeometry = OctagonalGeometryUtils.createOctagonalSideGeometry(
        topVertices, bottomVertices, l1, l2, scale
      );

      const clonedSideTexture = sideTexture.clone();
      clonedSideTexture.wrapS = THREE.RepeatWrapping;
      clonedSideTexture.wrapT = THREE.RepeatWrapping;

      const sideMaterial = new THREE.MeshStandardMaterial({
        map: clonedSideTexture,
        side: THREE.DoubleSide
      });

      const sideMesh = new THREE.Mesh(sideGeometry, sideMaterial);
      sideMesh.castShadow = true;
      sideMesh.receiveShadow = true;
      group.add(sideMesh);
    }

    return group;
  }

  async load(scene: THREE.Scene): Promise<void> {
    const {
      SCALE,
      MAIN_EDGE_LENGTH,
      CORNER_EDGE_LENGTH,
      STAGE_LIFT_ENABLED,
      STAGE_LIFT_SIZE,
      LIFT_STAGE_HEIGHT
    } = StageConfig;
    const squareSide = MAIN_EDGE_LENGTH * SCALE / 2 + CORNER_EDGE_LENGTH * SCALE / Math.sqrt(2);

    const topTexture = await this.loader.loadAsync("./stage.png");
    topTexture.colorSpace = THREE.SRGBColorSpace;

    const sideTexture = await this.loader.loadAsync("./curtain.png");
    sideTexture.colorSpace = THREE.SRGBColorSpace;

    // メインステージを作成
    const stageMesh = this.createOctagonalPrism(
      MAIN_EDGE_LENGTH,
      CORNER_EDGE_LENGTH,
      SCALE,
      topTexture,
      sideTexture,
      STAGE_LIFT_ENABLED,
      STAGE_LIFT_SIZE
    );
    stageMesh.position.y = -0.25;
    stageMesh.position.z = squareSide - StageConfig.STAGE_OFFSET;
    stageMesh.receiveShadow = true;
    scene.add(stageMesh);

    // LiftStageを作成・配置（リフトが有効な場合）
    if (STAGE_LIFT_ENABLED) {
      this.liftStage = new LiftStage(topTexture);
      this.liftStage.setPosition(
        0, // X座標: 中央
        LIFT_STAGE_HEIGHT, // Y座標: 設定値
        squareSide - StageConfig.STAGE_OFFSET // Z座標: メインステージと同じ
      );
      scene.add(this.liftStage.getGroup());
    }
  }

  public dispose(): void {
    if (this.liftStage) {
      this.liftStage.dispose();
      this.liftStage = null;
    }
  }
}
