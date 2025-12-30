/**
 * CityScene.ts - メインの街並みシーン管理
 * Three.jsを使用してサイバーパンクな都市フライスルーをレンダリング
 */

import * as THREE from 'three';
import { createCityChunk, CHUNK_SIZE } from './buildings';
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

// フライスルー設定
const MOVE_SPEED = 2.0; // カメラの前進速度
const CAMERA_HEIGHT = 15; // カメラの高さ（地上付近）
const CHUNK_COUNT = 3; // 同時に表示するチャンク数（手前から奥へ）

const cityChunks: THREE.Group[] = [];
let totalDistance = 0;

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

  // フォグ設定（遠くをぼかす）
  scene.fog = new THREE.FogExp2(0x050510, 0.0015);
  scene.background = new THREE.Color(0x050510);

  // カメラ設定
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
  camera.position.set(0, CAMERA_HEIGHT, 0);
  camera.lookAt(0, CAMERA_HEIGHT, -100);

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

  // 街並み生成（チャンクベース）
  initCityChunks(scene, isMobile);

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
 * 初期の街並みチャンクを生成
 */
function initCityChunks(scene: THREE.Scene, isMobile: boolean): void {
  // 既存のチャンクがあれば削除
  cityChunks.forEach(chunk => scene.remove(chunk));
  cityChunks.length = 0;
  totalDistance = 0;

  for (let i = 0; i < CHUNK_COUNT; i++) {
    const chunk = createCityChunk(i, isMobile);

    // buildings.ts の createCityChunk は `zStart = -chunkIndex * CHUNK_SIZE` で生成するが、
    // Chunk 0, 1, 2 が正しく並ぶようになっている。
    // chunk index 0: ranges from 0 to -1000
    // chunk index 1: ranges from -1000 to -2000
    // ...
    // なのでそのまま追加すればつながる。

    scene.add(chunk);
    cityChunks.push(chunk);
  }
}

/**
 * ライティングをセットアップ
 */
function setupLighting(scene: THREE.Scene): void {
  // 環境光
  const ambientLight = new THREE.AmbientLight(0x4a3a6a, 0.5);
  scene.add(ambientLight);

  // 都市の光（月明かりやネオンの反射）
  const dirLight = new THREE.DirectionalLight(0x6688ff, 1.0);
  dirLight.position.set(100, 200, 50);
  scene.add(dirLight);

  // 道路からの照り返し的なライト
  const streetLight = new THREE.PointLight(0xffaa00, 0.5, 300);
  streetLight.position.set(0, 10, -50);
  scene.add(streetLight);
}

/**
 * 無限ループ処理
 */
function updateCityInfiniteLoop(): void {
  // カメラ移動
  camera.position.z -= MOVE_SPEED;
  totalDistance += MOVE_SPEED;

  // 1チャンクリサイクル判定
  if (totalDistance >= CHUNK_SIZE) {
    // 一番後ろ（カメラから見て通過済み）のチャンクを取得
    const passedChunk = cityChunks.shift(); // 先頭を取り出す
    if (passedChunk) {
      // 一番奥のチャンクの位置を基準に配置
      // cityChunks は shift されたので、現在の末尾が一番奥のチャンク
      // const lastChunk = cityChunks[cityChunks.length - 1]; 

      // passedChunk をどう移動させるか？
      // 初期状態:
      // chunk[0] (z: 0~-1000)
      // chunk[1] (z: -1000~-2000)
      // chunk[2] (z: -2000~-3000)

      // loop 1: distance >= 1000.
      // passedChunk = chunk[0].
      // current array: [1, 2].
      // chunk[0] を chunk[2] の後ろ (-3000~-4000) に置きたい。
      // chunk[0] の元のジオメトリは 0~-1000。
      // なので position.z を -3000 にすれば OK。

      // 一般化:
      // 今まで何回リサイクルしたか？
      // あるいは、相対的にずらす。
      // 今回は position.z を「ずらす」だけで対応。
      // 移動量は常に `-(CHUNK_COUNT * CHUNK_SIZE)`

      passedChunk.position.z -= CHUNK_COUNT * CHUNK_SIZE;

      // シーンに追加しなおす必要はない（group内の入れ替えではないため）
      // 配列に戻す
      cityChunks.push(passedChunk);

      // 距離カウンタをリセット（余剰分を持ち越す）
      totalDistance -= CHUNK_SIZE;
    }
  }
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

  // カメラ・シーン更新
  updateCityInfiniteLoop();

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

  cityChunks.length = 0;
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
