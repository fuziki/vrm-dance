import * as THREE from "three";

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private modelCenter = new THREE.Vector3(0, 1.0, 0);

  // 回転・パン・ズーム状態
  private rotateX = 0;
  private rotateY = -Math.PI;
  private panOffset = new THREE.Vector3();
  private distance = 4.0;

  // マウス操作用
  private isDragging = false;
  private isRightButton = false;
  private prevMouseX = 0;
  private prevMouseY = 0;

  // タッチ操作用
  private isTouching = false;
  private prevTouches: Touch[] = [];

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.initEventListeners();
  }

  private initEventListeners(): void {
    // マウスイベント
    this.domElement.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.domElement.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.domElement.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.domElement.addEventListener("mouseleave", this.onMouseUp.bind(this));
    this.domElement.addEventListener("wheel", this.onWheel.bind(this), { passive: false });
    this.domElement.addEventListener("contextmenu", (e) => e.preventDefault());

    // タッチイベント
    this.domElement.addEventListener("touchstart", this.onTouchStart.bind(this), { passive: false });
    this.domElement.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
    this.domElement.addEventListener("touchend", this.onTouchEnd.bind(this));
  }

  private onMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.isRightButton = e.button === 2;
    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const dx = e.clientX - this.prevMouseX;
    const dy = e.clientY - this.prevMouseY;

    if (this.isRightButton) {
      const panSpeed = 0.002 * this.distance;
      this.panOffset.x += dx * panSpeed;
      this.panOffset.y += dy * panSpeed;
    } else {
      this.rotateY -= dx * 0.005;
      this.rotateX -= dy * 0.005;
      this.rotateX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotateX));
    }

    this.prevMouseX = e.clientX;
    this.prevMouseY = e.clientY;
  }

  private onMouseUp(): void {
    this.isDragging = false;
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    this.distance += e.deltaY * 0.001;
    this.distance = Math.max(0.5, Math.min(10.0, this.distance));
  }

  private onTouchStart(e: TouchEvent): void {
    this.isTouching = true;
    this.prevTouches = [...e.touches];
  }

  private onTouchMove(e: TouchEvent): void {
    if (!this.isTouching) return;
    e.preventDefault();

    const touches = [...e.touches];

    if (touches.length === 1 && this.prevTouches.length === 1) {
      const dx = touches[0].clientX - this.prevTouches[0].clientX;
      const dy = touches[0].clientY - this.prevTouches[0].clientY;
      this.rotateY -= dx * 0.005;
      this.rotateX -= dy * 0.005;
      this.rotateX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotateX));
    } else if (touches.length === 2 && this.prevTouches.length === 2) {
      const dx = ((touches[0].clientX + touches[1].clientX) / 2) -
                 ((this.prevTouches[0].clientX + this.prevTouches[1].clientX) / 2);
      const dy = ((touches[0].clientY + touches[1].clientY) / 2) -
                 ((this.prevTouches[0].clientY + this.prevTouches[1].clientY) / 2);
      const panSpeed = 0.001 * this.distance;
      this.panOffset.y += dy * panSpeed;

      const prevDist = Math.hypot(
        this.prevTouches[0].clientX - this.prevTouches[1].clientX,
        this.prevTouches[0].clientY - this.prevTouches[1].clientY
      );
      const currDist = Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
      const zoomDelta = prevDist - currDist;
      this.distance += zoomDelta * 0.01;
      this.distance = Math.max(0.5, Math.min(10.0, this.distance));
    }

    this.prevTouches = touches;
  }

  private onTouchEnd(): void {
    this.isTouching = false;
    this.prevTouches = [];
  }

  public update(): void {
    const offset = new THREE.Vector3(0, 0, this.distance);
    const quat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(this.rotateX, this.rotateY, 0, "YXZ")
    );
    offset.applyQuaternion(quat);
    this.camera.position.copy(this.modelCenter).add(offset).add(this.panOffset);
    this.camera.lookAt(this.modelCenter.clone().add(this.panOffset));
  }
}
