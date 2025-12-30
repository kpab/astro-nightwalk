/**
 * performance.ts - パフォーマンス最適化
 * モバイル対応とFPS管理
 */

import * as THREE from 'three';
import { skylineConfig } from '../config/skyline.config';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  isMobile: boolean;
  pixelRatio: number;
}

let lastTime = performance.now();
let frameCount = 0;
let currentFPS = 60;

/**
 * モバイルデバイスかどうかを判定
 */
export function detectMobileDevice(): boolean {
  // 画面サイズとUser Agentで判定
  const isSmallScreen = window.innerWidth < 768;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return isSmallScreen || (isTouchDevice && isMobileUA);
}

/**
 * 最適なピクセル比を取得
 */
export function getOptimalPixelRatio(isMobile: boolean): number {
  const config = skylineConfig.performance;
  const devicePixelRatio = window.devicePixelRatio || 1;

  if (isMobile) {
    return Math.min(devicePixelRatio, config.mobilePixelRatio);
  }

  return Math.min(devicePixelRatio, config.desktopPixelRatio);
}

/**
 * FPSを計測
 */
export function measureFPS(): number {
  frameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;

  if (elapsed >= 1000) {
    currentFPS = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastTime = currentTime;
  }

  return currentFPS;
}

/**
 * パフォーマンスメトリクスを取得
 */
export function getPerformanceMetrics(renderer: THREE.WebGLRenderer): PerformanceMetrics {
  const isMobile = detectMobileDevice();

  return {
    fps: currentFPS,
    frameTime: 1000 / currentFPS,
    isMobile,
    pixelRatio: renderer.getPixelRatio(),
  };
}

/**
 * レンダラーの品質を調整（FPSに基づく）
 */
export function adjustRendererQuality(
  renderer: THREE.WebGLRenderer,
  targetFPS: number = 60
): void {
  const metrics = getPerformanceMetrics(renderer);

  // FPSが目標より低い場合、品質を下げる
  if (metrics.fps < targetFPS * 0.8) {
    const currentRatio = renderer.getPixelRatio();
    const newRatio = Math.max(1, currentRatio - 0.25);

    if (newRatio !== currentRatio) {
      renderer.setPixelRatio(newRatio);
      console.log(`Reduced pixel ratio to ${newRatio} for better performance`);
    }
  }
}

/**
 * Intersection Observerでビューポート内かチェック
 */
export function createVisibilityObserver(
  element: HTMLElement,
  onVisible: () => void,
  onHidden: () => void
): IntersectionObserver {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          onVisible();
        } else {
          onHidden();
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  observer.observe(element);
  return observer;
}

/**
 * リソースの破棄ヘルパー
 */
export function disposeResources(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => disposeMaterial(material));
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

/**
 * マテリアルの破棄
 */
function disposeMaterial(material: THREE.Material): void {
  if (material instanceof THREE.MeshStandardMaterial) {
    if (material.map) material.map.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
  }
  material.dispose();
}

/**
 * テクスチャ解像度をモバイル用に調整
 */
export function getMobileTextureScale(): number {
  const isMobile = detectMobileDevice();
  return isMobile ? 0.5 : 1.0;
}

/**
 * モバイル用のビル数を取得
 */
export function getOptimalBuildingCount(isMobile: boolean): number {
  const config = skylineConfig;

  if (isMobile) {
    return config.performance.mobileBuildingCount;
  }

  return config.buildings.count;
}
