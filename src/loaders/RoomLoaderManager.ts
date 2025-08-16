import * as THREE from "three";
import { OctagonalGeometryUtils } from "../util/OctagonalGeometryUtils";

// 設定値を管理
class RoomConfig {
  static readonly SCALE = 0.5;
  static readonly YOKO = 10;
  static readonly NANAME = 2;
  static readonly STAGE_OFFSET = 0.5;
  static readonly FOG_RADIUS = 10;
  static readonly LED_UNIFORMS = {
    color: new THREE.Color(0x00ccff),
    ledCount: 25,
    speed: 10,
    radius: 0.5
  };
}

// 霧エフェクト管理
class FogLoader {
  private loader: THREE.TextureLoader;

  constructor(loader: THREE.TextureLoader) {
    this.loader = loader;
  }

  async load(scene: THREE.Scene): Promise<void> {
    const texture = await this.loader.loadAsync("./fog.png");
    const radius = RoomConfig.FOG_RADIUS;
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

// LED システム管理
class LEDSystem {
  private material: THREE.ShaderMaterial;
  private clock: THREE.Clock;

  constructor(clock: THREE.Clock) {
    this.clock = clock;
    this.createMaterial();
  }

  private createMaterial(): void {
    const uniforms = {
      time: { value: 0 },
      color: { value: RoomConfig.LED_UNIFORMS.color.clone() },
      ledCount: { value: RoomConfig.LED_UNIFORMS.ledCount },
      speed: { value: RoomConfig.LED_UNIFORMS.speed },
      radius: { value: RoomConfig.LED_UNIFORMS.radius }
    };

    this.material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: ShaderLibrary.LED_VERTEX_SHADER,
      fragmentShader: ShaderLibrary.LED_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      lights: false
    });
  }

  private createLEDPlane(width: number, rotation: THREE.Euler, position: THREE.Vector3): THREE.Mesh {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(width * RoomConfig.SCALE, 0.015),
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
      vertexShader: ShaderLibrary.BASE_VERTEX_SHADER,
      fragmentShader: ShaderLibrary.BASE_FRAGMENT_SHADER,
      side: THREE.DoubleSide,
    });

    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(width * RoomConfig.SCALE, 0.025),
      baseMaterial
    );

    plane.rotation.copy(rotation);
    plane.position.copy(position);
    plane.receiveShadow = false;

    return plane;
  }

  load(scene: THREE.Scene): void {
    const { SCALE, YOKO, NANAME } = RoomConfig;
    const squareSide = NANAME * SCALE / Math.sqrt(2) / 2;
    const offset = RoomConfig.STAGE_OFFSET;
    const offsetX = YOKO * SCALE / 2;

    // LED プレーン設定
    const ledConfigs = [
      {
        width: YOKO,
        rotation: new THREE.Euler(0, 0, Math.PI),
        position: new THREE.Vector3(0, -0.02, -offset)
      },
      {
        width: NANAME,
        rotation: new THREE.Euler(0, Math.PI / 4 * 3, 0),
        position: new THREE.Vector3(squareSide + offsetX, -0.02, squareSide - offset)
      },
      {
        width: NANAME,
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

// ステージローダー
class StageLoader {
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
    const { SCALE, YOKO, NANAME } = RoomConfig;
    const squareSide = YOKO * SCALE / 2 + NANAME * SCALE / Math.sqrt(2);

    const topTexture = await this.loader.loadAsync("./stage.png");
    topTexture.colorSpace = THREE.SRGBColorSpace;

    const sideTexture = await this.loader.loadAsync("./curtain.png");
    sideTexture.colorSpace = THREE.SRGBColorSpace;

    const stageMesh = this.createOctagonalPrism(YOKO, NANAME, SCALE, topTexture, sideTexture);
    stageMesh.position.y = -0.25;
    stageMesh.position.z = squareSide - RoomConfig.STAGE_OFFSET;
    stageMesh.receiveShadow = true;

    scene.add(stageMesh);
  }
}

// メインマネージャークラス
export class RoomLoaderManager {
  private loader: THREE.TextureLoader;
  private clock: THREE.Clock;
  private fogLoader: FogLoader;
  private ledSystem: LEDSystem;
  private stageLoader: StageLoader;

  constructor() {
    this.loader = new THREE.TextureLoader();
    this.clock = new THREE.Clock();

    // 各システムを初期化
    this.fogLoader = new FogLoader(this.loader);
    this.ledSystem = new LEDSystem(this.clock);
    this.stageLoader = new StageLoader(this.loader);
  }

  public async loadFog(scene: THREE.Scene): Promise<void> {
    await this.fogLoader.load(scene);
  }

  public loadLED(scene: THREE.Scene): void {
    this.ledSystem.load(scene);
  }

  public async loadStage(scene: THREE.Scene): Promise<void> {
    await this.stageLoader.load(scene);
  }

  public async load(scene: THREE.Scene): Promise<void> {
    await this.loadFog(scene);
    this.loadLED(scene);
    await this.loadStage(scene);
  }

  public update(): void {
    this.ledSystem.update();
  }

  // 設定変更用のメソッド
  public updateLEDColor(color: THREE.Color): void {
    // LEDシステムの色を変更
    RoomConfig.LED_UNIFORMS.color = color;
  }

  public updateLEDSpeed(speed: number): void {
    // LEDシステムのスピードを変更
    RoomConfig.LED_UNIFORMS.speed = speed;
  }
}

// シェーダーファイル群
class ShaderLibrary {
  static readonly BASE_VERTEX_SHADER = `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;

    void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        mvPosition.z += 0.001;
        gl_Position = projectionMatrix * mvPosition;
    }
  `;

  static readonly LED_VERTEX_SHADER = `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;

    void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        mvPosition.z += 0.002;
        gl_Position = projectionMatrix * mvPosition;
    }
  `;

  static readonly BASE_FRAGMENT_SHADER = `
    void main() {
        gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);
    }
  `;

  static readonly LED_FRAGMENT_SHADER = `
    uniform float time;
    uniform vec3 color;
    uniform float ledCount;
    uniform float speed;
    uniform float radius;

    varying vec2 vUv;

    float baseIntensity = 0.1;
    float waveIntensity = 1.0;

    float roundedRectSDF(vec2 p, vec2 size, float radius) {
        vec2 d = abs(p) - size + vec2(radius);
        return length(max(d, 0.0)) - radius;
    }

    void main() {
        float ledIndex = floor(vUv.x * ledCount);
        float localX = fract(vUv.x * ledCount) - 0.5;
        float localY = vUv.y - 0.5;
        vec2 localPos = vec2(localX, localY) * 2.0;

        float dist = roundedRectSDF(localPos, vec2(0.7, 1), radius);
        float shape = 1.0 - smoothstep(0.0, -0.05, -dist);

        float wavePhase = (ledIndex / ledCount) * 6.28318 - time * speed;
        float wave = (sin(wavePhase) + 1.0) * 0.5;

        float wave2 = (sin(wavePhase * 2.0 + time * speed * 0.5) + 1.0) * 0.5;
        float combinedWave = mix(wave, wave2, 0.3);

        float intensity = shape * (baseIntensity + combinedWave * waveIntensity);

        gl_FragColor = vec4(color * intensity, 1.0);
    }
  `;
}
