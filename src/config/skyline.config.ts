/**
 * skyline.config.ts - 街並みテーマの設定
 * ユーザーがカスタマイズ可能な設定項目
 */

export const skylineConfig = {
  // ビル設定
  buildings: {
    count: 60, // ビルの数
    minHeight: 15, // 最小高さ
    maxHeight: 80, // 最大高さ
    minWidth: 8, // 最小幅
    maxWidth: 20, // 最大幅
    minDepth: 8, // 最小奥行き
    maxDepth: 20, // 最大奥行き
    gridSize: 200, // 配置グリッドのサイズ
    spacing: 5, // ビル間の最小間隔
  },

  // ライティング
  lighting: {
    sunColor: 0xff7b00,
    sunIntensity: 1.2,
    sunPosition: { x: -50, y: 30, z: -50 },
    ambientColor: 0x4a3a6a,
    ambientIntensity: 0.4,
    hemisphereTopColor: 0xff9966,
    hemisphereBottomColor: 0x3a2a5a,
    hemisphereIntensity: 0.3,
  },

  // 空
  sky: {
    topColor: 0x1a0533, // 深い紫
    middleColor: 0xff6b35, // オレンジ
    bottomColor: 0xffb347, // 黄金色
  },

  // フォグ
  fog: {
    enabled: true,
    color: 0x2a1a3a,
    near: 50,
    far: 300,
  },

  // パフォーマンス
  performance: {
    mobilePixelRatio: 1.5,
    desktopPixelRatio: 2.0,
    mobileBuildingCount: 40,
    enableShadows: false, // パフォーマンスのため無効
  },

  // カメラ
  camera: {
    fov: 60,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 35, z: 90 },
    lookAt: { x: 0, y: 25, z: 0 },
  },
};

export type SkylineConfig = typeof skylineConfig;
