import * as THREE from "three";
import { StageConfig } from "../config/StageConfig";
import { OctagonalGeometryUtils } from "../../util/OctagonalGeometryUtils";

export class StageLoader {
  private loader: THREE.TextureLoader;

  constructor(loader: THREE.TextureLoader) {
    this.loader = loader;
  }

  createOctagonalPrism(
    l1: number,
    l2: number,
    scale: number,
    topTexture: THREE.Texture,
    sideTexture: THREE.Texture
  ): THREE.Group {
    const group = new THREE.Group();
    const height = scale;

    const { topVertices, bottomVertices, squareSide } = OctagonalGeometryUtils.createOctagonalVertices(
      l1, l2, scale, height
    );

    // 上面
    const topGeometry = OctagonalGeometryUtils.createOctagonalTopGeometry(topVertices, squareSide, height);
    const topMaterial = new THREE.MeshStandardMaterial({
      map: topTexture,
      side: THREE.DoubleSide
    });

    const topMesh = new THREE.Mesh(topGeometry, topMaterial);
    topMesh.castShadow = true;
    topMesh.receiveShadow = true;
    group.add(topMesh);

    // 側面
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

    return group;
  }

  async load(scene: THREE.Scene): Promise<void> {
    const { SCALE, YOKO, NANAME } = StageConfig;
    const squareSide = YOKO * SCALE / 2 + NANAME * SCALE / Math.sqrt(2);

    const topTexture = await this.loader.loadAsync("./stage.png");
    topTexture.colorSpace = THREE.SRGBColorSpace;

    const sideTexture = await this.loader.loadAsync("./curtain.png");
    sideTexture.colorSpace = THREE.SRGBColorSpace;

    const stageMesh = this.createOctagonalPrism(YOKO, NANAME, SCALE, topTexture, sideTexture);
    stageMesh.position.y = -0.25;
    stageMesh.position.z = squareSide - StageConfig.STAGE_OFFSET;
    stageMesh.receiveShadow = true;

    scene.add(stageMesh);
  }
}
