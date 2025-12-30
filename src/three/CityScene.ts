/**
 * CityScene.ts - メインの街並みシーン管理
 * Three.jsを使用して夕方の街並みをレンダリング
 */

import * as THREE from 'three';
import { skylineConfig } from '../config/skyline.config';
import { generateCityscape } from './buildings';
import { setupSkyEnvironment } from './sky';
import {
  detectMobileDevice,
  getOptimalPixelRatio,
  createVisibilityObserver,
  disposeResources,
  measureFPS,
  adjustRendererQuality,
} from './performance';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationId: number;
let isVisible = true;
let visibilityObserver: IntersectionObserver | null = null;
let frameCounter = 0;
const FPS_CHECK_INTERVAL = 60;

// カメラアニメーション用の変数
let animationTime = 0;
const baseCameraPosition = new THREE.Vector3();

// アニメーション設定
const CAMERA_DRIFT_SPEED = 0.0012; // カメラの前進速度（高速）
const CAMERA_DRIFT_RANGE = 40; // 前後の移動範囲
const CAMERA_SWAY_AMOUNT = 3; // 横揺れの量
const CAMERA_SWAY_SPEED = 0.001; // 横揺れの速度

/**
 * 街並みシーンを初期化
 */
export function initCityScene(canvas: HTMLCanvasElement, container: HTMLElement): void {
  // WebGLサポートチェック
  if (!isWebGLSupported()) {
    console.warn('WebGL is not supported');
    showFallback(container);
    return;
  }

  const isMobile = detectMobileDevice();
  const config = skylineConfig;

  // シーン作成
  scene = new THREE.Scene();

  // 空と太陽を作成
  setupSkyEnvironment(scene);

  // フォグ設定
  if (config.fog.enabled) {
    scene.fog = new THREE.Fog(config.fog.color, config.fog.near, config.fog.far);
  }

  // カメラ設定
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(config.camera.fov, aspect, config.camera.near, config.camera.far);
  camera.position.set(config.camera.position.x, config.camera.position.y, config.camera.position.z);
  camera.lookAt(config.camera.lookAt.x, config.camera.lookAt.y, config.camera.lookAt.z);

  // 基本カメラ位置を保存
  baseCameraPosition.copy(camera.position);

  // レンダラー設定
  const pixelRatio = getOptimalPixelRatio(isMobile);
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance',
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(pixelRatio);

  // トーンマッピング（よりリアルな色調）
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // ライティング設定
  setupLighting(scene, config);

  // 街並み生成
  generateCityscape(scene, isMobile);

  // リサイズハンドラ
  const resizeHandler = debounce(() => handleResize(container, isMobile), 100);
  window.addEventListener('resize', resizeHandler);

  // Visibility Observer（画面外では描画を停止）
  visibilityObserver = createVisibilityObserver(
    container,
    () => {
      isVisible = true;
      if (!animationId) {
        animate();
      }
    },
    () => {
      isVisible = false;
    }
  );

  // アニメーションループ開始
  animate();
}

/**
 * カメラのドリフトアニメーションを更新
 * 手前に流れるような動きを実現
 */
function updateCameraDrift(): void {
  animationTime += 1;

  // 前後の動き（手前に向かってゆっくり移動し、一定距離で戻る）
  const driftProgress = (animationTime * CAMERA_DRIFT_SPEED) % 1;
  // イージング関数で滑らかな動きに
  const easedProgress = easeInOutSine(driftProgress);
  const zOffset = -easedProgress * CAMERA_DRIFT_RANGE;

  // 横方向の微小な揺れ（浮遊感）
  const swayX = Math.sin(animationTime * CAMERA_SWAY_SPEED) * CAMERA_SWAY_AMOUNT;
  const swayY = Math.sin(animationTime * CAMERA_SWAY_SPEED * 0.7) * CAMERA_SWAY_AMOUNT * 0.3;

  // カメラ位置を更新
  camera.position.x = baseCameraPosition.x + swayX;
  camera.position.y = baseCameraPosition.y + swayY;
  camera.position.z = baseCameraPosition.z + zOffset;

  // 視線は常にシーンの中心に向ける
  camera.lookAt(
    skylineConfig.camera.lookAt.x,
    skylineConfig.camera.lookAt.y,
    skylineConfig.camera.lookAt.z
  );
}

/**
 * イージング関数（サイン波）
 */
function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * ライティングをセットアップ
 */
function setupLighting(scene: THREE.Scene, config: typeof skylineConfig): void {
  // 環境光
  const ambientLight = new THREE.AmbientLight(config.lighting.ambientColor, config.lighting.ambientIntensity);
  scene.add(ambientLight);

  // 太陽光（ディレクショナルライト）
  const sunLight = new THREE.DirectionalLight(config.lighting.sunColor, config.lighting.sunIntensity);
  sunLight.position.set(
    config.lighting.sunPosition.x,
    config.lighting.sunPosition.y,
    config.lighting.sunPosition.z
  );
  scene.add(sunLight);

  // 半球ライト（空と地面からの間接光）
  const hemisphereLight = new THREE.HemisphereLight(
    config.lighting.hemisphereTopColor,
    config.lighting.hemisphereBottomColor,
    config.lighting.hemisphereIntensity
  );
  scene.add(hemisphereLight);
}

/**
 * リサイズ処理
 */
function handleResize(container: HTMLElement, isMobile: boolean): void {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(getOptimalPixelRatio(isMobile));
}

/**
 * アニメーションループ
 */
function animate(): void {
  if (!isVisible) {
    animationId = 0;
    return;
  }

  animationId = requestAnimationFrame(animate);

  // FPS計測と品質調整
  frameCounter++;
  if (frameCounter >= FPS_CHECK_INTERVAL) {
    const fps = measureFPS();
    if (fps < 50) {
      adjustRendererQuality(renderer, 60);
    }
    frameCounter = 0;
  }

  // カメラのドリフトアニメーション
  updateCameraDrift();

  renderer.render(scene, camera);
}

/**
 * シーンの破棄
 */
export function disposeCityScene(): void {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = 0;
  }

  if (visibilityObserver) {
    visibilityObserver.disconnect();
    visibilityObserver = null;
  }

  if (scene) {
    disposeResources(scene);
  }

  if (renderer) {
    renderer.dispose();
  }
}

/**
 * WebGLサポートチェック
 */
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * フォールバック表示
 */
function showFallback(container: HTMLElement): void {
  container.style.background = `linear-gradient(to bottom,
    ${hexToRgb(skylineConfig.sky.topColor)},
    ${hexToRgb(skylineConfig.sky.middleColor)},
    ${hexToRgb(skylineConfig.sky.bottomColor)})`;
}

/**
 * 16進数カラーをRGB文字列に変換
 */
function hexToRgb(hex: number): string {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * デバウンス関数
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
