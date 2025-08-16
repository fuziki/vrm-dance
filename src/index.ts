import * as THREE from "three";
import { SceneManager } from "./core/SceneManager";
import { LightManager } from "./core/LightManager";
import { WorldManager } from "./world/WorldManager";
import { VRMLoaderManager } from "./loaders/VRMLoader";
import { CameraController } from "./controls/CameraController";
import { AnimationManager } from "./animation/AnimationManager";
import { PsylliumManager } from "./effects/PsylliumManager";
import { FileInput } from "./ui/FileInput";

class App {
  private sceneManager: SceneManager;
  private lightManager: LightManager;
  private worldManager: WorldManager;
  private vrmLoader: VRMLoaderManager;
  private cameraController: CameraController;
  private animationManager: AnimationManager;
  private psylliumManager: PsylliumManager;
  private fileInput: FileInput;
  private clock: THREE.Clock;

  constructor() {
    const canvas = document.getElementById("canvas") as HTMLDivElement;
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }

    // 各マネージャーの初期化
    this.sceneManager = new SceneManager(canvas);
    this.lightManager = new LightManager();
    this.worldManager = new WorldManager();
    this.vrmLoader = new VRMLoaderManager(this.sceneManager.scene);
    this.cameraController = new CameraController(
      this.sceneManager.camera,
      this.sceneManager.renderer.domElement
    );
    this.animationManager = new AnimationManager();
    this.psylliumManager = new PsylliumManager(this.sceneManager.camera);
    this.fileInput = new FileInput();
    this.clock = new THREE.Clock();

    this.init();
  }

  private async init(): Promise<void> {
    this.lightManager.load(this.sceneManager.scene);
    await this.worldManager.load(this.sceneManager.scene);
    await this.psylliumManager.load(this.sceneManager.scene);

    this.vrmLoader.onLoaded = (vrm, vrma) => {
      this.handleVRMALoaded(vrm, vrma);
    };

    // ファイル選択時の処理
    this.fileInput.onFileSelected = (file) => {
      this.vrmLoader.loadVRMFromFile(file);
    };

    // リサイズイベント
    window.addEventListener("resize", () => {
      this.sceneManager.handleResize();
    });

    // アニメーションループ開始
    this.animate();
  }

  private handleVRMALoaded(vrm: any, vrma: any): void {
    this.animationManager.initAnimation(vrm, vrma);
    this.fileInput.hide();
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();

    this.animationManager.update(delta);
    this.vrmLoader.update(delta);
    this.cameraController.update();
    this.psylliumManager.update(); // After Camera
    this.worldManager.update();

    // レンダリング
    this.sceneManager.render();
  }
}

// アプリケーション起動
window.addEventListener("DOMContentLoaded", () => {
  new App();
});
