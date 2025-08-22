import * as THREE from "three";
import { MaterialManager } from "./MaterialManager";
import { LightUnit } from "./LightUnit";
import { StageConfig, SpotlightUniforms, SystemConfig, LightUnitConfig, AudienceTierConfig, SingleBeamConfig, DebugConfig } from "../world/config/StageConfig";

export class SpotlightSystem {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private materialManager: MaterialManager;
  private audienceMaterialManager: MaterialManager;
  private lightUnits: LightUnit[] = [];
  private audienceLightUnits: LightUnit[] = [];
  private rotationSpeed: number = StageConfig.SPOTLIGHT.lightUnit.rotationSpeed;
  private audienceRotationSpeed: number = StageConfig.SPOTLIGHT.audienceTier.lightUnit.rotationSpeed;
  private geometry: THREE.PlaneGeometry;
  private audienceGeometry: THREE.PlaneGeometry;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.materialManager = new MaterialManager(this.createSpotlightUniforms());
    this.audienceMaterialManager = new MaterialManager(this.createAudienceSpotlightUniforms());
    this.geometry = this.createGeometry();
    this.audienceGeometry = this.createAudienceGeometry();

    this.loadLightUnits();
  }

  private createGeometry(): THREE.PlaneGeometry {
    const beam: SingleBeamConfig = StageConfig.SPOTLIGHT.singleBeam;
    const geometry = new THREE.PlaneGeometry(beam.topWidth, beam.height);
    geometry.translate(0, beam.height / 2, 0);
    return geometry;
  }

  private createAudienceGeometry(): THREE.PlaneGeometry {
    const beam: SingleBeamConfig = StageConfig.SPOTLIGHT.audienceTier.singleBeam;
    const geometry = new THREE.PlaneGeometry(beam.topWidth, beam.height);
    geometry.translate(0, beam.height / 2, 0);
    return geometry;
  }

  public loadLightUnits(): void {
    this.clearLightUnits();

    const system: SystemConfig = StageConfig.SPOTLIGHT.system;
    const lightUnitConfig: LightUnitConfig = StageConfig.SPOTLIGHT.lightUnit;
    const audienceTier: AudienceTierConfig = StageConfig.SPOTLIGHT.audienceTier;

    // 既存のメインステージ上の照明
    for (let u = 0; u < system.unitCount; u++) {
      const unit = new LightUnit(
        this.materialManager,
        this.geometry,
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
      this.lightUnits.push(unit);
    }

    // 既存のサイド照明
    for (let u = 0; u < system.unitCount; u++) {
      const unit = new LightUnit(
        this.materialManager,
        this.geometry,
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
      this.lightUnits.push(unit);
    }

    // 2階席客席照明（観客席からステージに向けて）
    if (audienceTier.enabled) {
      this.createAudienceTierLights(audienceTier);
    }
  }

  private createAudienceTierLights(audienceTier: AudienceTierConfig): void {
    const k: number = audienceTier.distance;
    const audienceLightUnitConfig: LightUnitConfig = audienceTier.lightUnit;

    // 4箇所の座標: (k,k), (k,-k), (-k,k), (-k,-k)
    const positions: { x: number; z: number }[] = [
      { x: k, z: k + 8 },   // 右奥
      { x: -k, z: k + 8 },  // 左奥
    ];

    positions.forEach((pos) => {
      const unit = new LightUnit(
        this.audienceMaterialManager,
        this.audienceGeometry,
        audienceLightUnitConfig.count,
        audienceLightUnitConfig.circleRadius,
        audienceLightUnitConfig.tiltAngle
      );

      // 位置を設定
      unit.setUnitPosition(pos.x, audienceTier.positionY, pos.z);

      // y軸が原点を向くように方向ベクトルを計算
      const position = new THREE.Vector3(pos.x, audienceTier.positionY, pos.z);
      const target = new THREE.Vector3(0, 0, 5);
      const direction = new THREE.Vector3().subVectors(target, position).normalize();

      // y軸が方向ベクトルと一致するように回転を計算
      const yAxis = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(yAxis, direction);
      const rotation = new THREE.Euler().setFromQuaternion(quaternion);

      // 回転を適用
      unit.setUnitTilt(rotation);

      this.scene.add(unit.group);
      this.audienceLightUnits.push(unit);
    });
  }

  public setLightUnitPosition(unitIndex: number, x: number, y: number, z: number): void {
    if (unitIndex >= 0 && unitIndex < this.lightUnits.length) {
      this.lightUnits[unitIndex].setUnitPosition(x, y, z);
    }
  }

  public setLightUnitTilt(unitIndex: number, tiltAngle: number): void {
    if (unitIndex >= 0 && unitIndex < this.lightUnits.length) {
      const rotation = new THREE.Euler(0, 0, tiltAngle * Math.PI / 180);
      this.lightUnits[unitIndex].setUnitTilt(rotation);
    }
  }

  public updateSingleBeamTilt(tiltAngle: number): void {
    this.lightUnits.forEach(lightUnit => {
      lightUnit.updateSingleBeamTilt(tiltAngle);
    });
  }

  public updateMaterialUniforms(uniforms: Partial<SpotlightUniforms>): void {
    this.materialManager.updateUniforms(uniforms);

    this.lightUnits.forEach(lightUnit => {
      const formattedUniforms: Record<string, any> = {};
      Object.keys(uniforms).forEach(key => {
        const uniformKey = `u${key.charAt(0).toUpperCase()}${key.slice(1)}`;
        formattedUniforms[uniformKey] = uniforms[key as keyof SpotlightUniforms];
      });
      lightUnit.updateMaterialUniforms(formattedUniforms);
    });
  }

  public setWireframeVisibility(visible: boolean): void {
    this.lightUnits.forEach(lightUnit => {
      lightUnit.setWireframeVisibility(visible);
    });
  }

  public updateGeometry(topWidth?: number, height?: number): void {
    const beam = StageConfig.SPOTLIGHT.singleBeam;
    const newTopWidth = topWidth ?? beam.topWidth;
    const newHeight = height ?? beam.height;

    const newGeometry = new THREE.PlaneGeometry(newTopWidth, newHeight);
    newGeometry.translate(0, newHeight / 2, 0);

    this.lightUnits.forEach(lightUnit => {
      lightUnit.updateGeometry(newGeometry);
    });

    this.geometry.dispose();
    this.geometry = newGeometry;
  }

  private createSpotlightUniforms(): SpotlightUniforms {
    const beam: SingleBeamConfig = StageConfig.SPOTLIGHT.singleBeam;
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

  private createAudienceSpotlightUniforms(): SpotlightUniforms {
    const beam: SingleBeamConfig = StageConfig.SPOTLIGHT.audienceTier.singleBeam;
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
    this.lightUnits.forEach(lightUnit => {
      lightUnit.updateCameraPosition(this.camera.position);
      lightUnit.rotateGroup(this.rotationSpeed * 0.01);
    });

    this.audienceLightUnits.forEach(lightUnit => {
      lightUnit.updateCameraPosition(this.camera.position);
      lightUnit.rotateGroup(this.audienceRotationSpeed * 0.01);
    });
  }

  public setRotationSpeed(speed: number): void {
    this.rotationSpeed = speed;
  }

  private clearLightUnits(): void {
    this.lightUnits.forEach(lightUnit => {
      this.scene.remove(lightUnit.group);
      lightUnit.dispose();
    });
    this.lightUnits = [];

    this.audienceLightUnits.forEach(lightUnit => {
      this.scene.remove(lightUnit.group);
      lightUnit.dispose();
    });
    this.audienceLightUnits = [];
  }

  public dispose(): void {
    this.clearLightUnits();
    this.geometry.dispose();
    this.audienceGeometry.dispose();
    this.materialManager.dispose();
    this.audienceMaterialManager.dispose();
  }
}
