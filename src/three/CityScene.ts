/**
 * CityScene.ts - メインの街並みシーン管理
 * Three.jsを使用して夕方の街並みをレンダリング
 */

import * as THREE from 'three';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let animationId: number;

/**
 * 街並みシーンを初期化
 */
export function initCityScene(canvas: HTMLCanvasElement, container: HTMLElement): void {
  // WebGLサポートチェック
  if (!isWebGLSupported()) {
    console.warn('WebGL is not supported');
    return;
  }

  // シーン作成
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a0533);

  // カメラ設定
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
  camera.position.set(0, 30, 80);
  camera.lookAt(0, 20, 0);

  // レンダラー設定
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 基本ライティング（Phase 3で詳細実装）
  const ambientLight = new THREE.AmbientLight(0x4a3a6a, 0.4);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xff7b00, 1.2);
  sunLight.position.set(-50, 30, -50);
  scene.add(sunLight);

  // テスト用ボックス（Phase 2で置き換え）
  const geometry = new THREE.BoxGeometry(10, 40, 10);
  const material = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const testBuilding = new THREE.Mesh(geometry, material);
  testBuilding.position.y = 20;
  scene.add(testBuilding);

  // 地面
  const groundGeometry = new THREE.PlaneGeometry(500, 500);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  scene.add(ground);

  // リサイズハンドラ
  window.addEventListener('resize', () => handleResize(container));

  // アニメーションループ開始
  animate();
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

  window.removeEventListener('resize', () => {});
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
