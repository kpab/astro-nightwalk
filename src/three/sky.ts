/**
 * sky.ts - 夕方の空のレンダリング
 * グラデーションシェーダーを使用した空の表現
 */

import * as THREE from 'three';
import { skylineConfig } from '../config/skyline.config';

// 空のシェーダー
const skyVertexShader = `
  varying vec3 vWorldPosition;

  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = `
  uniform vec3 topColor;
  uniform vec3 middleColor;
  uniform vec3 bottomColor;
  uniform float offset;
  uniform float exponent;

  varying vec3 vWorldPosition;

  void main() {
    float h = normalize(vWorldPosition + offset).y;

    // 3色グラデーション（下→中→上）
    vec3 color;
    if (h < 0.0) {
      // 地平線以下
      color = bottomColor;
    } else if (h < 0.3) {
      // 地平線付近（下→中）
      float t = h / 0.3;
      t = pow(t, exponent);
      color = mix(bottomColor, middleColor, t);
    } else {
      // 上空（中→上）
      float t = (h - 0.3) / 0.7;
      t = pow(t, exponent * 0.5);
      color = mix(middleColor, topColor, t);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

/**
 * 空のドームを作成
 */
export function createSky(scene: THREE.Scene): THREE.Mesh {
  const config = skylineConfig.sky;

  // 大きな球体ジオメトリを作成（内側を向く）
  const skyGeometry = new THREE.SphereGeometry(500, 32, 32);

  // シェーダーマテリアル
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(config.topColor) },
      middleColor: { value: new THREE.Color(config.middleColor) },
      bottomColor: { value: new THREE.Color(config.bottomColor) },
      offset: { value: 20 },
      exponent: { value: 0.8 },
    },
    vertexShader: skyVertexShader,
    fragmentShader: skyFragmentShader,
    side: THREE.BackSide, // 内側からレンダリング
    depthWrite: false,
  });

  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);

  return sky;
}

/**
 * 太陽を表現するグローエフェクト
 */
export function createSunGlow(scene: THREE.Scene): THREE.Mesh {
  const config = skylineConfig.lighting;

  // 太陽のグローを表現するスプライト用のジオメトリ
  const sunGeometry = new THREE.PlaneGeometry(100, 100);

  // グローシェーダー
  const sunMaterial = new THREE.ShaderMaterial({
    uniforms: {
      sunColor: { value: new THREE.Color(config.sunColor) },
      glowIntensity: { value: 1.5 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 sunColor;
      uniform float glowIntensity;
      varying vec2 vUv;

      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(vUv, center);

        // ソフトなグラデーション
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        glow = pow(glow, 2.0) * glowIntensity;

        // 外側のソフトグロー
        float outerGlow = 1.0 - smoothstep(0.2, 0.8, dist);
        outerGlow = pow(outerGlow, 3.0) * 0.5;

        float alpha = glow + outerGlow;
        vec3 color = sunColor * (glow + outerGlow * 0.3);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const sun = new THREE.Mesh(sunGeometry, sunMaterial);

  // 太陽の位置（地平線付近、左側）
  sun.position.set(-150, 40, -200);
  sun.lookAt(0, 40, 0);

  scene.add(sun);

  return sun;
}

/**
 * 空と太陽を一括で作成
 */
export function setupSkyEnvironment(scene: THREE.Scene): { sky: THREE.Mesh; sun: THREE.Mesh } {
  const sky = createSky(scene);
  const sun = createSunGlow(scene);

  return { sky, sun };
}
