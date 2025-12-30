/**
 * CityScene.ts - メインの街並みシーン管理
 * Three.jsを使用して夕方の街並みをレンダリング
 */

import * as THREE from 'three';
import { skylineConfig } from '../config/skyline.config';
import { generateCityscape } from './buildings';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationId: number;

/**
 * モバイルデバイスかどうかを判定
 */
function isMobileDevice(): boolean {
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * 街並みシーンを初期化
 */
export function initCityScene(canvas: HTMLCanvasElement, container: HTMLElement): void {
  // WebGLサポートチェック
  if (!isWebGLSupported()) {
    console.warn('WebGL is not supported');
    return;
  }

  const isMobile = isMobileDevice();
  const config = skylineConfig;

  // シーン作成
  scene = new THREE.Scene();
  scene.background = new THREE.Color(config.sky.topColor);

  // フォグ設定
  if (config.fog.enabled) {
    scene.fog = new THREE.Fog(config.fog.color, config.fog.near, config.fog.far);
  }

  // カメラ設定
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(config.camera.fov, aspect, config.camera.near, config.camera.far);
  camera.position.set(config.camera.position.x, config.camera.position.y, config.camera.position.z);
  camera.lookAt(config.camera.lookAt.x, config.camera.lookAt.y, config.camera.lookAt.z);

  // レンダラー設定
  const pixelRatio = isMobile ? config.performance.mobilePixelRatio : config.performance.desktopPixelRatio;
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile, // モバイルではアンチエイリアス無効
    alpha: false,
    powerPreference: isMobile ? 'low-power' : 'high-performance',
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));

  // ライティング設定
  setupLighting(scene, config);

  // 街並み生成
  generateCityscape(scene, isMobile);

  // リサイズハンドラ
  const resizeHandler = () => handleResize(container);
  window.addEventListener('resize', resizeHandler);

  // アニメーションループ開始
  animate();
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
function handleResize(container: HTMLElement): void {
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
}

/**
 * アニメーションループ
 */
function animate(): void {
  animationId = requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

/**
 * シーンの破棄
 */
export function disposeCityScene(): void {
  if (animationId) {
    cancelAnimationFrame(animationId);
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
