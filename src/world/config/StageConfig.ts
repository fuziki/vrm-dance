import * as THREE from "three";

export interface SpotlightUniforms {
  uVerticalGain: number;
  uHorizontalGain: number;
  uTopWidth: number;
  uBottomWidth: number;
  uTopBrightness: number;
  uNearTopBrightness: number;
  uShowUV: boolean;
  uShowVerticalOnly: boolean;
  uShowHorizontalOnly: boolean;
}

export interface LightUnitConfig {
  count: number;
  circleRadius: number;
  tiltAngle: number;
  rotationSpeed: number;
}

export interface SingleBeamConfig {
  height: number;
  topWidth: number;
  bottomWidth: number;
  verticalGain: number;
  horizontalGain: number;
  topBrightness: number;
  nearTopBrightness: number;
}

export interface SystemConfig {
  unitCount: number;
  unitSpacing: number;
  positionY: number;
  positionZ: number;
  tiltGain: number;
}

export interface AudienceTierConfig {
  enabled: boolean;
  distance: number;
  positionY: number;
  unitCount: number;
  lightUnit: LightUnitConfig;
  singleBeam: SingleBeamConfig;
}

export interface DebugConfig {
  showUV: boolean;
  showVerticalOnly: boolean;
  showHorizontalOnly: boolean;
}

export class StageConfig {
  static readonly SCALE = 0.5;
  static readonly MAIN_EDGE_LENGTH = 10;
  static readonly CORNER_EDGE_LENGTH = 2;
  static readonly STAGE_OFFSET = 0.5;
  static readonly STAGE_LIFT_ENABLED = false;
  static readonly STAGE_LIFT_SIZE = 3.5;

  // LiftStage設定
  static readonly LIFT_STAGE_FLOOR_THICKNESS = 0.05;  // 床の厚さ
  static readonly LIFT_STAGE_PILLAR_HEIGHT = 0.5;    // 柱の高さ
  static readonly LIFT_STAGE_PILLAR_SIZE = 3.3;      // 柱の太さ（一辺）
  static readonly LIFT_STAGE_HEIGHT = 0.1;           // LiftStageの高さ（Y座標）

  static readonly FOG_RADIUS = 10;

  static readonly LED_UNIFORMS = {
    color: new THREE.Color(0x00ccff),
    ledCount: 25,
    speed: 10,
    radius: 0.5
  };

  // スポットライト設定
  static readonly SPOTLIGHT = {
    // システム全体設定
    system: {
      unitCount: 4, // LightUnit数
      unitSpacing: 0.8, // ユニット間距離
      positionY: -0.1, // Y座標
      positionZ: 6.5, // Z座標
      tiltGain: 0.4, // ユニット傾き調整係数
    },

    // 2階席客席照明設定
    audienceTier: {
      enabled: true, // 2階席照明有効化
      distance: 10, // ステージからの距離 (k値)
      positionY: 12, // Y座標（客席高さ）
      unitCount: 10, // 2階席LightUnit数
      lightUnit: {
        count: 12, // SingleBeam数（2階席用、既存より多く）
        circleRadius: 0.08, // ビーム配置半径（既存より大きく）
        tiltAngle: -6, // ビーム傾斜角度（既存より急角度）
        rotationSpeed: 0, // 回転速度（既存より遅く）
      },
      singleBeam: {
        height: 18, // ビーム高さ（既存より長く）
        topWidth: 3.0, // 上部幅
        bottomWidth: 0.3, // 下部幅
        verticalGain: 0.8, // 縦方向光強度
        horizontalGain: 1, // 横方向光強度
        topBrightness: 0.1, // 最上部明度
        nearTopBrightness: 0.4, // 上部付近明度
      },
    },

    // LightUnit設定
    lightUnit: {
      count: 6, // SingleBeam数（LightUnitの表現）
      circleRadius: 0.05, // ビーム配置半径
      tiltAngle: -3, // ビーム傾斜角度
      rotationSpeed: 0.8, // 回転速度
    },

    // SingleBeam設定
    singleBeam: {
      height: 10, // ビーム高さ
      topWidth: 1.5, // 上部幅
      bottomWidth: 0.2, // 下部幅
      verticalGain: 0.5, // 縦方向光強度
      horizontalGain: 0.8, // 横方向光強度
      topBrightness: 0.0, // 最上部明度
      nearTopBrightness: 0.25, // 上部付近明度
    },

    // デバッグ設定
    debug: {
      showUV: false,
      showVerticalOnly: false,
      showHorizontalOnly: false,
    },
  };
}
