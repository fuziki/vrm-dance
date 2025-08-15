import * as THREE from "three";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";
import { VRMAnimationLoaderPlugin } from "@pixiv/three-vrm-animation";

export class VRMLoaderManager {
  private loader: GLTFLoader;
  private scene: THREE.Scene;
  private currentVrm: GLTF | null;
  public currentVrmAnimation: GLTF | null;
  // public onVRMLoaded?: (vrm: GLTF) => void;
  // public onVRMALoaded?: (vrma: GLTF) => void;
  public onLoaded?: (vrm: GLTF, vrma: GLTF) => void;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.loader.register((parser) => new VRMLoaderPlugin(parser));
    this.loader.register((parser) => new VRMAnimationLoaderPlugin(parser));
  }

  public loadVRMFromFile(file: File): void {
    const blobUrl = URL.createObjectURL(file);
    this.loader.load(
      blobUrl,
      (gltf: GLTF) => {
        this.initVRM(gltf);
      },
      undefined,
      (error) => console.error("VRM load error:", error)
    );
  }

  private loadVRMA(): void {
    this.loader.load(
      "./ppp.vrma",
      (gltf: GLTF) => {
        this.initVRMA(gltf);
      },
      undefined,
      (error) => console.error("VRMA load error:", error)
    );
  }

  private initVRM(gltf: GLTF): void {
    if (this.currentVrm) {
      this.scene.remove(this.currentVrm.scene);
      this.currentVrm = null;
    }

    const vrm = gltf.userData.vrm;
    if (!vrm) return;

    vrm.scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
      }
    });

    this.currentVrm = vrm;
    this.scene.add(vrm.scene);

    // if (this.onVRMLoaded) {
    //   this.onVRMLoaded(vrm);
    // }

    this.loadVRMA();
  }

  private initVRMA(gltf: GLTF): void {
    const vrmAnimations = gltf.userData.vrmAnimations;
    if (!vrmAnimations) return;

    this.currentVrmAnimation = vrmAnimations[0] ?? null;

    // if (this.onVRMALoaded) {
    //   this.onVRMALoaded(this.currentVrmAnimation);
    // }
    if (this.onLoaded && this.currentVrm && this.currentVrmAnimation) {
      this.onLoaded(this.currentVrm!, this.currentVrmAnimation!)
    }
  }

  public update(delta: number): void {
    if (this.currentVrm) {
      (this.currentVrm as any).update(delta);
    }
  }
}
