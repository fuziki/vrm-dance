import * as THREE from "three";
import vertexShader from '../rendering/shaders/stick.vert';
import fragmentShader from '../rendering/shaders/stick.frag';

export class PsylliumManager {
    private loader: THREE.TextureLoader;
    private arenaAdditiveMaterial: THREE.ShaderMaterial;
    private arenaNormalMaterial: THREE.ShaderMaterial;
    private standMaterial: THREE.ShaderMaterial;

    private arenaAdditiveInstancedMesh: THREE.InstancedMesh;
    private arenaNormalInstancedMesh: THREE.InstancedMesh;
    private standInstancedMesh: THREE.InstancedMesh;
    private clock: THREE.Clock;

    // Injected
    private camera: THREE.Camera;

    // サイリウムの設定
    private readonly ARENA_COUNT = 50;
    private readonly FIRST_FLOOR_STAND_COUNT = 400;
    private readonly SECOND_FLOOR_STAND_COUNT = 600;
    private readonly THIRD_FLOOR_STAND_COUNT = 600;

    constructor(camera: THREE.Camera) {
        this.loader = new THREE.TextureLoader();
        this.clock = new THREE.Clock();
        this.camera = camera;

        // マテリアルを作成
        this.arenaAdditiveMaterial = this.createPsylliumMaterial(THREE.AdditiveBlending, 'full3.png');
        this.arenaNormalMaterial = this.createPsylliumMaterial(THREE.NormalBlending, 'full2.png');
        this.standMaterial = this.createPsylliumMaterial(THREE.AdditiveBlending, 'full-b.png')
    }

    private createPsylliumMaterial(blendingMode: THREE.Blending, texturePath: string): THREE.ShaderMaterial {
        const tex = this.loader.load(texturePath);
        tex.colorSpace = THREE.SRGBColorSpace;
        return new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                time: { value: 0 },
                swingFrequency: { value: 0.60 },
                swingOffset: { value: 0.3 },
                opacity: { value: 1 },
                customCameraPosition: { value: this.camera.position },
                texBody: { value: tex }
            },
            transparent: true,
            blending: blendingMode,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true,
            lights: false
        });
    }

    public loadPsyllium(scene: THREE.Scene): void {
        this.loadStand(scene);
        this.loadArena(scene);
    }

    private loadStand(scene: THREE.Scene): void {
        const geometry = new THREE.PlaneGeometry(0.2, 0.2);
        const meshCount = this.FIRST_FLOOR_STAND_COUNT + this.SECOND_FLOOR_STAND_COUNT + this.THIRD_FLOOR_STAND_COUNT;

        this.standMaterial.uniforms.opacity.value = 0.9;

        this.standInstancedMesh = new THREE.InstancedMesh(
            geometry.clone(),
            this.standMaterial,
            meshCount
        );

        // カスタム属性を追加
        const randomSeeds = new Float32Array(meshCount);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < meshCount; i++) {
            // ランダムな位置に配置
            var x: number;
            var y: number;
            var z: number;
            const minAngle = Math.PI * -0.05;  // 左端
            const maxAngle = Math.PI * 1.05;  // 右端
            const angle = Math.random() * (maxAngle - minAngle) + minAngle;
            var radius = Math.random();

            if (i < this.FIRST_FLOOR_STAND_COUNT) {
                y = radius * 0.6 - 0.2;
                radius = radius * 10 + 10;
            } else if (i < this.FIRST_FLOOR_STAND_COUNT + this.SECOND_FLOOR_STAND_COUNT) {
                y = radius * 1.2 + 1.2;
                radius = radius * 10 + 15;
            } else {
                y = radius * 1.8 + 3;
                radius = radius * 10 + 18;
            }

            x = Math.cos(angle) * radius * 0.5;
            z = (Math.sin(angle) * radius) * 0.5;

            z += 2;

            dummy.position.set(x, y, z);
            dummy.updateMatrix();
            this.standInstancedMesh.setMatrixAt(i, dummy.matrix);
            randomSeeds[i] = Math.random();
        }

        this.standInstancedMesh.geometry.setAttribute('randomSeed', new THREE.InstancedBufferAttribute(randomSeeds, 1));
        this.standInstancedMesh.instanceMatrix.needsUpdate = true;
        this.standInstancedMesh.castShadow = false;
        this.standInstancedMesh.receiveShadow = false;

        scene.add(this.standInstancedMesh);
    }

    private loadArena(scene: THREE.Scene): void {
        const geometry = new THREE.PlaneGeometry(0.2, 0.2);
        const meshCount = this.ARENA_COUNT;

        this.arenaAdditiveInstancedMesh = new THREE.InstancedMesh(
            geometry.clone(),
            this.arenaAdditiveMaterial,
            meshCount
        );
        this.arenaNormalInstancedMesh = new THREE.InstancedMesh(
            geometry.clone(),
            this.arenaNormalMaterial,
            meshCount
        );

        // カスタム属性を追加
        const randomSeeds = new Float32Array(meshCount);
        const dummy = new THREE.Object3D();

        for (let i = 0; i < meshCount; i++) {
            // ランダムな位置に配置
            const angle = Math.random() * Math.PI * 0.8 + (Math.PI / 2) * 0.2;
            const radius = Math.random() * 6 + 2;
            const x = Math.cos(angle) * radius * 0.5;
            var z = (Math.sin(angle) * radius) * -0.5;
            z -= 0.2;

            const y = Math.random() * 0.0 - 0.1;
            dummy.position.set(x, y, z);

            dummy.updateMatrix();

            // 両方のメッシュに同じ変換を適用
            this.arenaAdditiveInstancedMesh.setMatrixAt(i, dummy.matrix);
            this.arenaNormalInstancedMesh.setMatrixAt(i, dummy.matrix);

            randomSeeds[i] = Math.random();
        }

        // 両方のジオメトリにカスタム属性を設定
        this.arenaAdditiveInstancedMesh.geometry.setAttribute('randomSeed', new THREE.InstancedBufferAttribute(randomSeeds, 1));
        this.arenaNormalInstancedMesh.geometry.setAttribute('randomSeed', new THREE.InstancedBufferAttribute(randomSeeds.slice(), 1)); // コピーを作成

        this.arenaAdditiveInstancedMesh.instanceMatrix.needsUpdate = true;
        this.arenaNormalInstancedMesh.instanceMatrix.needsUpdate = true;

        this.arenaAdditiveInstancedMesh.castShadow = false;
        this.arenaAdditiveInstancedMesh.receiveShadow = false;
        this.arenaNormalInstancedMesh.castShadow = false;
        this.arenaNormalInstancedMesh.receiveShadow = false;

        // 描画順序を制御（加算合成を先に、通常合成を後に）
        this.arenaAdditiveInstancedMesh.renderOrder = 0;
        this.arenaNormalInstancedMesh.renderOrder = 1;

        scene.add(this.arenaAdditiveInstancedMesh);
        scene.add(this.arenaNormalInstancedMesh);
    }

    // アニメーション更新
    public update(): void {
        const elapsedTime = this.clock.getElapsedTime();

        this.arenaAdditiveMaterial.uniforms.time.value = elapsedTime;
        this.arenaAdditiveMaterial.uniforms.customCameraPosition.value.copy(this.camera.position);

        this.arenaNormalMaterial.uniforms.time.value = elapsedTime;
        this.arenaNormalMaterial.uniforms.customCameraPosition.value.copy(this.camera.position);

        this.standMaterial.uniforms.time.value = elapsedTime;
        this.standMaterial.uniforms.customCameraPosition.value.copy(this.camera.position);
    }

    // サイリウムを削除
    public dispose(): void {
        this.arenaAdditiveInstancedMesh.geometry.dispose();
        this.arenaAdditiveMaterial.dispose();

        this.arenaNormalInstancedMesh.geometry.dispose();
        this.arenaNormalMaterial.dispose();
    }
}
