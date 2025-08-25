import * as THREE from "three";
import { SpotLightMaterialManager } from "./MaterialManager";
import { LightUnit } from "./LightUnit";
import { StageConfig, SpotlightUniforms, SideStageSystemConfig, LightUnitConfig, CeilingLightConfig, BeamConfig, DebugConfig } from "../world/config/StageConfig";

export class SpotlightSystem {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private sideStageMeterialManager: SpotLightMaterialManager;
  private ceilingMaterialManager: SpotLightMaterialManager;
  private sideStageUnits: LightUnit[] = [];
  private ceilingUnits: LightUnit[] = [];
  private sideStageRotationSpeed: number = StageConfig.SPOTLIGHT.sideStage.lightUnit.rotationSpeed;
  private ceilingRotationSpeed: number = StageConfig.SPOTLIGHT.ceiling.lightUnit.rotationSpeed;
  private sideStageGeometry: THREE.PlaneGeometry;
  private ceilingGeometry: THREE.PlaneGeometry;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.sideStageMeterialManager = new SpotLightMaterialManager(this.createSideStageSpotlightUniforms());
    this.ceilingMaterialManager = new SpotLightMaterialManager(this.createCeilingSpotlightUniforms());
    this.sideStageGeometry = this.createSideStageGeometry();
    this.ceilingGeometry = this.createCeilingGeometry();

    this.loadLightUnits();
  }

  private createSideStageGeometry(): THREE.PlaneGeometry {
    const beam: BeamConfig = StageConfig.SPOTLIGHT.sideStage.beam;
    const geometry = new THREE.PlaneGeometry(beam.topWidth, beam.height);
    geometry.translate(0, beam.height / 2, 0);
    return geometry;
  }

  private createCeilingGeometry(): THREE.PlaneGeometry {
    const beam: BeamConfig = StageConfig.SPOTLIGHT.ceiling.beam;
    const geometry = new THREE.PlaneGeometry(beam.topWidth, beam.height);
    geometry.translate(0, beam.height / 2, 0);
    return geometry;
  }

  public loadLightUnits(): void {
    this.clearSideStageAndCeilingUnits();

    const system: SideStageSystemConfig = StageConfig.SPOTLIGHT.sideStage.system;
    const lightUnitConfig: LightUnitConfig = StageConfig.SPOTLIGHT.sideStage.lightUnit;
    const ceilingConfig: CeilingLightConfig = StageConfig.SPOTLIGHT.ceiling;

    // メインステージ上のサイドステージライト
    for (let u = 0; u < system.unitCount; u++) {
      const unit = new LightUnit(
        this.sideStageMeterialManager,
        this.sideStageGeometry,
        lightUnitConfig.count,
        lightUnitConfig.circleRadius,
        lightUnitConfig.tiltAngle
      );

      // 位置設定
      const xPosition = (u - (system.unitCount - 1) / 2) * system.unitSpacing;
      unit.setUnitPosition(xPosition, system.positionY, system.positionZ);

      // 回転設定
      const gain = system.tiltGain;
      const unitTiltAngles = [45 * gain, 15 * gain, -15 * gain, -45 * gain];
      const unitTiltAngle = unitTiltAngles[u % unitTiltAngles.length];
      const rotation = new THREE.Euler(0, 0, unitTiltAngle * Math.PI / 180);
      unit.setUnitTilt(rotation);

      this.scene.add(unit.group);
      this.sideStageUnits.push(unit);
    }

    // サイドからのサイドステージライト
    for (let u = 0; u < system.unitCount; u++) {
      const unit = new LightUnit(
        this.sideStageMeterialManager,
        this.sideStageGeometry,
        lightUnitConfig.count,
        lightUnitConfig.circleRadius,
        lightUnitConfig.tiltAngle
      );

      // 位置設定
      const xPosition = (u - (system.unitCount - 1) / 2) * system.unitSpacing;
      unit.setUnitPosition(-3.5, system.positionY, xPosition + 3);

      // 回転設定
      const gain = -1 * system.tiltGain;
      const unitTiltAngles = [45 * gain, 15 * gain, -15 * gain, -45 * gain];
      const unitTiltAngle = unitTiltAngles[u % unitTiltAngles.length];
      const rotation = new THREE.Euler(unitTiltAngle * Math.PI / 180, 0, 0);
      unit.setUnitTilt(rotation);

      this.scene.add(unit.group);
      this.sideStageUnits.push(unit);
    }

    // 天井ライト（客席からステージに向けて）
    if (ceilingConfig.enabled) {
      this.createCeilingLights(ceilingConfig);
    }
  }

  private createCeilingLights(ceilingConfig: CeilingLightConfig): void {
    const k: number = ceilingConfig.distance;
    const ceilingLightUnitConfig: LightUnitConfig = ceilingConfig.lightUnit;

    // 4箇所の座標: (k,k), (k,-k), (-k,k), (-k,-k)
    const positions: { x: number; z: number }[] = [
      { x: k, z: k + 8 },   // 右奥
      { x: -k, z: k + 8 },  // 左奥
    ];

    positions.forEach((pos) => {
      const unit = new LightUnit(
        this.ceilingMaterialManager,
        this.ceilingGeometry,
        ceilingLightUnitConfig.count,
        ceilingLightUnitConfig.circleRadius,
        ceilingLightUnitConfig.tiltAngle
      );

      // 位置を設定
      unit.setUnitPosition(pos.x, ceilingConfig.positionY, pos.z);

      // y軸が原点を向くように方向ベクトルを計算
      const position = new THREE.Vector3(pos.x, ceilingConfig.positionY, pos.z);
      const target = new THREE.Vector3(0, 0, 5);
      const direction = new THREE.Vector3().subVectors(target, position).normalize();

      // y軸が方向ベクトルと一致するように回転を計算
      const yAxis = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(yAxis, direction);
      const rotation = new THREE.Euler().setFromQuaternion(quaternion);

      // 回転を適用
      unit.setUnitTilt(rotation);

      this.scene.add(unit.group);
      this.ceilingUnits.push(unit);
    });
  }

  public setSideStageUnitPosition(unitIndex: number, x: number, y: number, z: number): void {
    if (unitIndex >= 0 && unitIndex < this.sideStageUnits.length) {
      this.sideStageUnits[unitIndex].setUnitPosition(x, y, z);
    }
  }

  public setSideStageUnitTilt(unitIndex: number, tiltAngle: number): void {
    if (unitIndex >= 0 && unitIndex < this.sideStageUnits.length) {
      const rotation = new THREE.Euler(0, 0, tiltAngle * Math.PI / 180);
      this.sideStageUnits[unitIndex].setUnitTilt(rotation);
    }
  }

  public updateSideStageBeamTilt(tiltAngle: number): void {
    this.sideStageUnits.forEach(lightUnit => {
      lightUnit.updateBeamTilt(tiltAngle);
    });
  }

  public updateAllMaterialUniforms(uniforms: Partial<SpotlightUniforms>): void {
    this.sideStageMeterialManager.updateUniforms(uniforms);

    this.sideStageUnits.forEach(lightUnit => {
      const formattedUniforms: Record<string, any> = {};
      Object.keys(uniforms).forEach(key => {
        const uniformKey = `u${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        formattedUniforms[uniformKey] = uniforms[key as keyof SpotlightUniforms];
      });
      lightUnit.updateMaterialUniforms(formattedUniforms);
    });
  }

  public updateSideStageMaterialUniforms(uniforms: Partial<SpotlightUniforms>): void {
    this.sideStageMeterialManager.updateUniforms(uniforms);

    this.sideStageUnits.forEach(lightUnit => {
      // SpotlightUniforms already has the correct keys, pass them directly
      lightUnit.updateMaterialUniforms(uniforms as Record<string, any>);
    });
  }

  public updateCeilingMaterialUniforms(uniforms: Partial<SpotlightUniforms>): void {
    this.ceilingMaterialManager.updateUniforms(uniforms);

    this.ceilingUnits.forEach(lightUnit => {
      // SpotlightUniforms already has the correct keys, pass them directly
      lightUnit.updateMaterialUniforms(uniforms as Record<string, any>);
    });
  }

  public setSideStageWireframeVisibility(visible: boolean): void {
    this.sideStageUnits.forEach(lightUnit => {
      lightUnit.setWireframeVisibility(visible);
    });
  }

  public setCeilingWireframeVisibility(visible: boolean): void {
    this.ceilingUnits.forEach(lightUnit => {
      lightUnit.setWireframeVisibility(visible);
    });
  }

  public updateSideStageGeometry(topWidth?: number, height?: number): void {
    const beam = StageConfig.SPOTLIGHT.sideStage.beam;
    const newTopWidth = topWidth ?? beam.topWidth;
    const newHeight = height ?? beam.height;

    const newGeometry = new THREE.PlaneGeometry(newTopWidth, newHeight);
    newGeometry.translate(0, newHeight / 2, 0);

    this.sideStageUnits.forEach(lightUnit => {
      lightUnit.updateGeometry(newGeometry);
    });

    this.sideStageGeometry.dispose();
    this.sideStageGeometry = newGeometry;
  }

  private createSideStageSpotlightUniforms(): SpotlightUniforms {
    const beam: BeamConfig = StageConfig.SPOTLIGHT.sideStage.beam;
    const debug: DebugConfig = StageConfig.SPOTLIGHT.debug;

    return {
      uVerticalGain: beam.verticalGain,
      uHorizontalGain: beam.horizontalGain,
      uTopWidth: beam.topWidth,
      uBottomWidth: beam.bottomWidth,
      uTopBrightness: beam.topBrightness,
      uNearTopBrightness: beam.nearTopBrightness,
      uShowUV: debug.showUV,
      uShowVerticalOnly: debug.showVerticalOnly,
      uShowHorizontalOnly: debug.showHorizontalOnly,
    };
  }

  private createCeilingSpotlightUniforms(): SpotlightUniforms {
    const beam: BeamConfig = StageConfig.SPOTLIGHT.ceiling.beam;
    const debug: DebugConfig = StageConfig.SPOTLIGHT.debug;

    return {
      uVerticalGain: beam.verticalGain,
      uHorizontalGain: beam.horizontalGain,
      uTopWidth: beam.topWidth,
      uBottomWidth: beam.bottomWidth,
      uTopBrightness: beam.topBrightness,
      uNearTopBrightness: beam.nearTopBrightness,
      uShowUV: debug.showUV,
      uShowVerticalOnly: debug.showVerticalOnly,
      uShowHorizontalOnly: debug.showHorizontalOnly,
    };
  }

  public update(): void {
    this.sideStageUnits.forEach(lightUnit => {
      lightUnit.updateCameraPosition(this.camera.position);
      lightUnit.rotateGroup(this.sideStageRotationSpeed * 0.01);
    });

    this.ceilingUnits.forEach(lightUnit => {
      lightUnit.updateCameraPosition(this.camera.position);
      lightUnit.rotateGroup(this.ceilingRotationSpeed * 0.01);
    });
  }

  public setSideStageRotationSpeed(speed: number): void {
    this.sideStageRotationSpeed = speed;
  }

  public setCeilingRotationSpeed(speed: number): void {
    this.ceilingRotationSpeed = speed;
  }

  private clearSideStageAndCeilingUnits(): void {
    this.sideStageUnits.forEach(lightUnit => {
      this.scene.remove(lightUnit.group);
      lightUnit.dispose();
    });
    this.sideStageUnits = [];

    this.ceilingUnits.forEach(lightUnit => {
      this.scene.remove(lightUnit.group);
      lightUnit.dispose();
    });
    this.ceilingUnits = [];
  }

  public dispose(): void {
    this.clearSideStageAndCeilingUnits();
    this.sideStageGeometry.dispose();
    this.ceilingGeometry.dispose();
    this.sideStageMeterialManager.dispose();
    this.ceilingMaterialManager.dispose();
  }
}
