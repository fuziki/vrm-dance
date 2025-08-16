import * as THREE from "three";

export class StageConfig {
  static readonly SCALE = 0.5;
  static readonly MAIN_EDGE_LENGTH = 10;
  static readonly CORNER_EDGE_LENGTH = 2;
  static readonly STAGE_OFFSET = 0.5;
  static readonly FOG_RADIUS = 10;
  static readonly LED_UNIFORMS = {
    color: new THREE.Color(0x00ccff),
    ledCount: 25,
    speed: 10,
    radius: 0.5
  };
}
