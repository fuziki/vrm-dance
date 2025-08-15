import * as THREE from "three";
import { SceneManager } from "./core/SceneManager";
import { LightManager } from "./core/LightManager";
import { RoomLoaderManager } from "./loaders/RoomLoaderManager";
import { VRMLoaderManager } from "./loaders/VRMLoader";
import { CameraController } from "./controls/CameraController";
import { AnimationManager } from "./animation/AnimationManager";
import { PsylliumManager } from "./animation/PsylliumManager";
import { FileInput } from "./ui/FileInput";

class App {
  private sceneManager: SceneManager;
  private lightManager: LightManager;
  private roomLoader: RoomLoaderManager;
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
    this.lightManager = new LightManager(this.sceneManager.scene);
    this.roomLoader = new RoomLoaderManager();
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

  private init(): void {
    // テクスチャの読み込み
    this.roomLoader.loadAllTextures(this.sceneManager.scene);
    this.psylliumManager.loadPsyllium(this.sceneManager.scene);

    // VRMローダーのコールバック設定
    // this.vrmLoader.onVRMLoaded = (vrm) => {
    //   this.handleVRMLoaded(vrm);
    // };

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

  // private handleVRMLoaded(vrm: any): void {
  //   // VRMが読み込まれたら、アニメーションの初期化を試みる
  //   if (this.vrmLoader.currentVrmAnimation) {
  //     this.animationManager.initAnimation(vrm, this.vrmLoader.currentVrmAnimation);
  //   }
  // }

  private handleVRMALoaded(vrm: any, vrma: any): void {
    // VRMAが読み込まれたら、VRMがあればアニメーションを初期化
    this.animationManager.initAnimation(vrm, vrma);
    this.fileInput.hide();
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    // アニメーション更新
    this.animationManager.update(delta);

    // VRM更新
    // if (this.vrmLoader.currentVrm) {
    //   this.vrmLoader.currentVrm.update(delta);
    // }
    this.vrmLoader.update(delta);

    // カメラ更新
    this.cameraController.update();

    this.psylliumManager.update();

    this.roomLoader.update();

    // レンダリング
    this.sceneManager.render();
  }
}

// アプリケーション起動
window.addEventListener("DOMContentLoaded", () => {
  new App();
});
