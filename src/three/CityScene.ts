/**
 * CityScene.ts - メインの街並みシーン管理
 * Three.jsを使用して惑星都市をレンダリング
 */

import * as THREE from 'three';
import { skylineConfig } from '../config/skyline.config';
import { generateCityscape, getSphereRadius } from './buildings';
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

// カメラ軌道アニメーション用の変数
let orbitAngle = 0;
const ORBIT_SPEED = 0.002; // 軌道速度
const ORBIT_RADIUS = 180; // カメラの軌道半径
const ORBIT_HEIGHT = 60; // カメラの高さオフセット
const CAMERA_TILT = 0.3; // カメラの傾き（ラジアン）

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

  // シーン作成
  scene = new THREE.Scene();

  // 宇宙背景
  createSpaceBackground(scene);

  // カメラ設定
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000);
  camera.position.set(ORBIT_RADIUS, ORBIT_HEIGHT, 0);
  camera.lookAt(0, 0, 0);

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

  // トーンマッピング
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // ライティング設定
  setupLighting(scene);

  // 街並み生成（球体上）
  generateCityscape(scene, isMobile);

  // リサイズハンドラ
  const resizeHandler = debounce(() => handleResize(container, isMobile), 100);
  window.addEventListener('resize', resizeHandler);

  // Visibility Observer
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
 * 宇宙背景を作成
 */
function createSpaceBackground(scene: THREE.Scene): void {
  // 星空のシェーダー
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i += 3) {
    // 球状に星を配置
    const radius = 800 + Math.random() * 400;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i + 1] = radius * Math.cos(phi);
    positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.5,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  // 背景色
  scene.background = new THREE.Color(0x050510);
}

/**
 * ライティングをセットアップ
 */
function setupLighting(scene: THREE.Scene): void {
  // 環境光（弱め）
  const ambientLight = new THREE.AmbientLight(0x4a3a6a, 0.3);
  scene.add(ambientLight);

  // 太陽光（惑星の側面から）
  const sunLight = new THREE.DirectionalLight(0xff7b00, 1.5);
  sunLight.position.set(-200, 100, -100);
  scene.add(sunLight);

  // 反対側からの弱いフィルライト
  const fillLight = new THREE.DirectionalLight(0x6688ff, 0.3);
  fillLight.position.set(200, -50, 100);
  scene.add(fillLight);

  // 半球ライト
  const hemisphereLight = new THREE.HemisphereLight(0xff9966, 0x1a0533, 0.4);
  scene.add(hemisphereLight);
}

/**
 * カメラの軌道アニメーションを更新
 */
function updateCameraOrbit(): void {
  orbitAngle += ORBIT_SPEED;

  // 楕円軌道で回転
  const x = Math.cos(orbitAngle) * ORBIT_RADIUS;
  const z = Math.sin(orbitAngle) * ORBIT_RADIUS;
  const y = Math.sin(orbitAngle * 0.5) * ORBIT_HEIGHT + ORBIT_HEIGHT;

  camera.position.set(x, y, z);

  // 惑星の中心を見つつ、少し上を向く
  const lookAtY = Math.sin(orbitAngle * 0.3) * 20;
  camera.lookAt(0, lookAtY, 0);

  // カメラを少し傾ける
  camera.rotation.z = Math.sin(orbitAngle * 0.2) * CAMERA_TILT;
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

  // カメラ軌道アニメーション
  updateCameraOrbit();

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
  container.style.background = `radial-gradient(ellipse at center,
    rgb(26, 5, 51) 0%,
    rgb(5, 5, 16) 100%)`;
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
