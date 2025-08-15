import * as THREE from "three";

export class SceneManager {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  private canvas: HTMLDivElement;

  constructor(canvas: HTMLDivElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.canvas.appendChild(this.renderer.domElement);
  }

  private createCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      30,
      this.canvas.clientWidth / this.canvas.clientHeight,
      0.1,
      100
    );
    return camera;
  }

  private createRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
    renderer.setClearColor(0x282828, 1.0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.getRenderTarget();
    return renderer;
  }

  public render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  public handleResize(): void {
    this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight);
  }
}
