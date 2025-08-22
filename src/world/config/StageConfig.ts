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
      verticalGain: 0.7, // 縦方向光強度
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
