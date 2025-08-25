import * as THREE from "three";
import { StageConfig } from "./config/StageConfig";
import { FogLoader } from "./stage/FogLoader";
import { StageLoader } from "./stage/StageLoader";
import { LEDSystem } from "./lighting/LEDSystem";
import { SpotlightSystem } from "../lighting/SpotlightSystem";

export class WorldManager {
  private loader: THREE.TextureLoader;
  private clock: THREE.Clock;
  private fogLoader: FogLoader;
  private ledSystem: LEDSystem;
  private stageLoader: StageLoader;
  private spotlightSystem: SpotlightSystem;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.loader = new THREE.TextureLoader();
    this.clock = new THREE.Clock();

    // 各システムを初期化
    this.fogLoader = new FogLoader(this.loader);
    this.ledSystem = new LEDSystem(this.clock);
    this.stageLoader = new StageLoader(this.loader);
    this.spotlightSystem = new SpotlightSystem(scene, camera);
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
    this.spotlightSystem.loadLightUnits();
  }

  public update(): void {
    this.ledSystem.update();
    this.spotlightSystem.update();
  }

  // 設定変更用のメソッド
  public updateLEDColor(color: THREE.Color): void {
    StageConfig.LED_UNIFORMS.color = color;
  }

  public updateLEDSpeed(speed: number): void {
    StageConfig.LED_UNIFORMS.speed = speed;
  }

  public updateSpotlightConfig(): void {
    this.spotlightSystem.loadLightUnits();
  }

  public getSpotlightSystem(): SpotlightSystem {
    return this.spotlightSystem;
  }

  public dispose(): void {
    this.spotlightSystem.dispose();
  }
}
