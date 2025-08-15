import * as THREE from "three";

export class RoomLoaderManager {
  private loader: THREE.TextureLoader;
  private ledMaterial: THREE.ShaderMaterial;
  private clock: THREE.Clock;

  private stageSize = 5.5;

  constructor() {
    this.loader = new THREE.TextureLoader();
    this.clock = new THREE.Clock();
  }

  public loadFloor2(scene: THREE.Scene): void {
    this.loader.load("./stage.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);

      const geometry = new THREE.PlaneGeometry(this.stageSize, this.stageSize);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      const floor = new THREE.Mesh(geometry, material);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = 0;
      floor.position.z = (this.stageSize / 2) - 0.5;
      floor.receiveShadow = true;
      scene.add(floor);
    });
  }

  public loadFloor22(scene: THREE.Scene): void {
    this.loader.load("./curtain.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(this.stageSize * 2, 1);

      const geometry = new THREE.PlaneGeometry(this.stageSize, 0.5);

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });

      const floor = new THREE.Mesh(geometry, material);
      floor.rotation.x = 0;
      floor.position.y = -0.25;
      floor.position.z = -0.5;
      floor.receiveShadow = false;
      scene.add(floor);
    });
  }

  public loadFloor(scene: THREE.Scene): void {
    this.loader.load("./habaki.png", (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(10, 10);

      const geometry = new THREE.PlaneGeometry(10, 10);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
      const floor = new THREE.Mesh(geometry, material);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.4;
      floor.receiveShadow = true;
      scene.add(floor);
    });
  }

  public loadWall(scene: THREE.Scene): void {
    this.loader.load("./fog.png", (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);

      const size = 10;
      const geometry = new THREE.PlaneGeometry(size, size);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      });
      const wall = new THREE.Mesh(geometry, material);
      wall.position.z = this.stageSize / 2;
      wall.position.y = size / 2 - 2.5;
      // wall.rotation.y = Math.PI;
      wall.receiveShadow = false;
      scene.add(wall);
    });
  }

  public loadLED(scene: THREE.Scene): void {
    const uniforms = {
      time: { value: 0 },
      color: { value: new THREE.Color(0x00ccff) },
      ledCount: { value: this.stageSize * 30 },
      speed: { value: 10 },
      radius: { value: 0.5 }
    };

    this.ledMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      lights: false
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(this.stageSize, 0.015), this.ledMaterial);
    plane.rotation.z = Math.PI;
    plane.position.y = -0.02;
    plane.position.z = -0.5 - 0.01;
    plane.receiveShadow = false;
    scene.add(plane);

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.05, 0.05, 0.05),
      side: THREE.DoubleSide,
    });
    const base = new THREE.Mesh(new THREE.PlaneGeometry(this.stageSize, 0.025), baseMaterial);
    base.rotation.z = Math.PI;
    base.position.y = -0.02;
    base.position.z = -0.5 - 0.005;
    base.receiveShadow = false;
    scene.add(base);
  }

  public loadAllTextures(scene: THREE.Scene): void {
    // this.loadFloor(scene);
    this.loadFloor2(scene);
    this.loadFloor22(scene);
    this.loadWall(scene);
    this.loadLED(scene);
  }

  public update(): void {
    this.ledMaterial.uniforms.time.value = this.clock.getElapsedTime();
  }
}

const vertexShader = `
uniform float time;
uniform vec3 color;

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float time;
uniform vec3 color;
uniform float ledCount; // 横のLED数
uniform float speed;    // 波スピード
uniform float radius;   // 角の丸み
float baseIntensity = 0.1; // 基本の明るさ（消えない部分）
float waveIntensity = 1.0; // 波の追加明るさ

varying vec2 vUv;

float roundedRectSDF(vec2 p, vec2 size, float radius) {
    vec2 d = abs(p) - size + vec2(radius);
    return length(max(d, 0.0)) - radius;
}

void main() {
    // LEDインデックスとローカル座標（中心が0,0になるよう変換）
    float ledIndex = floor(vUv.x * ledCount);
    float localX = fract(vUv.x * ledCount) - 0.5;
    float localY = vUv.y - 0.5;
    vec2 localPos = vec2(localX, localY) * 2.0; // [-1,1]に正規化

    // 角丸矩形の形状
    float dist = roundedRectSDF(localPos, vec2(0.7, 1), radius);
    float shape = 1.0 - smoothstep(0.0, -0.05, -dist); // 内側を1.0に

    // Sin波による連続的な流れ
    float wavePhase = (ledIndex / ledCount) * 6.28318 - time * speed; // 2π倍でより密な波
    float wave = (sin(wavePhase) + 1.0) * 0.5; // 0.0-1.0の範囲に正規化

    // 複数の波を重ね合わせて連続感を強化
    float wave2 = (sin(wavePhase * 2.0 + time * speed * 0.5) + 1.0) * 0.5;
    float combinedWave = mix(wave, wave2, 0.3);

    // 基本明度 + 波による追加明度
    float intensity = shape * (baseIntensity + combinedWave * waveIntensity);

    gl_FragColor = vec4(color * intensity, 1.0);
}
`;

// export class RoomLoaderManager {
//   private loader: THREE.TextureLoader;

//   constructor() {
//     this.loader = new THREE.TextureLoader();
//   }

//   public loadFloor(scene: THREE.Scene): void {
//     this.loader.load("./floor.png", (texture) => {
//       texture.wrapS = THREE.RepeatWrapping;
//       texture.wrapT = THREE.RepeatWrapping;
//       texture.repeat.set(10, 10);

//       const geometry = new THREE.PlaneGeometry(10, 10);
//       const material = new THREE.MeshStandardMaterial({
//         map: texture,
//         side: THREE.DoubleSide,
//       });
//       const floor = new THREE.Mesh(geometry, material);
//       floor.rotation.x = -Math.PI / 2;
//       floor.position.y = 0;
//       floor.receiveShadow = true;
//       scene.add(floor);
//     });
//   }

//   public loadWall(scene: THREE.Scene): void {
//     this.loader.load("./wall.png", (texture) => {
//       texture.wrapS = THREE.RepeatWrapping;
//       texture.wrapT = THREE.RepeatWrapping;
//       texture.repeat.set(20, 10);

//       const geometry = new THREE.PlaneGeometry(10, 5);
//       const material = new THREE.MeshStandardMaterial({
//         map: texture,
//         side: THREE.DoubleSide,
//       });
//       const wall = new THREE.Mesh(geometry, material);
//       wall.position.z = 1;
//       wall.position.y = 2.5;
//       wall.rotation.y = Math.PI;
//       wall.receiveShadow = true;
//       scene.add(wall);
//     });
//   }

//   public loadHabaki(scene: THREE.Scene): void {
//     this.loader.load("./habaki.png", (texture) => {
//       texture.wrapS = THREE.RepeatWrapping;
//       texture.wrapT = THREE.RepeatWrapping;
//       texture.repeat.set(20, 1);

//       const height = 0.05;
//       const geometry = new THREE.PlaneGeometry(10, height);
//       const material = new THREE.MeshStandardMaterial({
//         map: texture,
//         side: THREE.DoubleSide,
//       });
//       const habaki = new THREE.Mesh(geometry, material);
//       habaki.position.z = 0.999;
//       habaki.position.y = height / 2;
//       habaki.rotation.y = Math.PI;
//       habaki.receiveShadow = true;
//       scene.add(habaki);
//     });
//   }

//   public loadAllTextures(scene: THREE.Scene): void {
//     this.loadFloor(scene);
//     this.loadWall(scene);
//     this.loadHabaki(scene);
//   }
// }
