import * as THREE from "three";
import { MaterialManager } from "./MaterialManager";
import { LightUnit } from "./LightUnit";
import { StageConfig, SpotlightUniforms } from "../world/config/StageConfig";

export class SpotlightSystem {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private materialManager: MaterialManager;
  private lightUnits: LightUnit[] = [];
  private rotationSpeed: number = StageConfig.SPOTLIGHT.lightUnit.rotationSpeed;
  private geometry: THREE.PlaneGeometry;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.materialManager = new MaterialManager(this.createSpotlightUniforms());
    this.geometry = this.createGeometry();

    this.loadLightUnits();
  }

  private createGeometry(): THREE.PlaneGeometry {
    const beam = StageConfig.SPOTLIGHT.singleBeam;
    const geometry = new THREE.PlaneGeometry(beam.topWidth, beam.height);
    geometry.translate(0, beam.height / 2, 0);
    return geometry;
  }

  public loadLightUnits(): void {
    this.clearLightUnits();

    const system = StageConfig.SPOTLIGHT.system;
    const lightUnitConfig = StageConfig.SPOTLIGHT.lightUnit;

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
      unit.setUnitTilt(0, 0, unitTiltAngle);

      this.scene.add(unit.group);
      this.lightUnits.push(unit);
    }

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
      unit.setUnitTilt(unitTiltAngle, 0, 0);

      this.scene.add(unit.group);
      this.lightUnits.push(unit);
    }
  }


  public setLightUnitPosition(unitIndex: number, x: number, y: number, z: number): void {
    if (unitIndex >= 0 && unitIndex < this.lightUnits.length) {
      this.lightUnits[unitIndex].setUnitPosition(x, y, z);
    }
  }

  public setLightUnitTilt(unitIndex: number, tiltAngle: number): void {
    if (unitIndex >= 0 && unitIndex < this.lightUnits.length) {
      this.lightUnits[unitIndex].setUnitTilt(0, 0, tiltAngle);
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
    const beam = StageConfig.SPOTLIGHT.singleBeam;
    const debug = StageConfig.SPOTLIGHT.debug;

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
  }

  public dispose(): void {
    this.clearLightUnits();
    this.geometry.dispose();
    this.materialManager.dispose();
  }
}
