import * as THREE from "three";
import { createVRMAnimationClip } from "@pixiv/three-vrm-animation";

export class AnimationManager {
  private mixer: THREE.AnimationMixer | null = null;
  private currentAction: THREE.AnimationAction | null = null;

  public initAnimation(vrm: any, vrmAnimation: any): void {
    if (!vrm || !vrmAnimation) return;

    if (this.mixer) {
      this.mixer.stopAllAction();
    }

    this.mixer = new THREE.AnimationMixer(vrm.scene);
    const clip = createVRMAnimationClip(vrmAnimation, vrm);
    this.currentAction = this.mixer.clipAction(clip);
    this.currentAction.setLoop(THREE.LoopOnce, 1);
    this.currentAction.clampWhenFinished = true;
    this.currentAction.play();

    this.mixer.addEventListener('finished', () => {
      setTimeout(() => {
        if (this.currentAction) {
          this.currentAction.time = 0;
          this.currentAction.paused = true;

          setTimeout(() => {
            if (this.currentAction) {
              this.currentAction.reset();
            }
          }, 1000);
        }
      }, 1000);
    });
  }

  public update(delta: number): void {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }

  public dispose(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    this.currentAction = null;
  }
}
