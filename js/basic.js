import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    // 사이즈 config
    this.size = 256 * 2;
    this.number = this.size * this.size;

    // 캔버스 사이즈 동기화
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // 렌더러 만들기
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x222222, 1);
    this.renderer.setPixelRatio(2);
    this.container.appendChild(this.renderer.domElement);

    // 카메라 만들기
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      100,
    );
    this.camera.position.z = 20;

    // 빛 만들기
    this.light = new THREE.PointLight(0xffffff, 1, 100);
    this.light.position.set(0, 10, 10);

    // 도형 만들기
    this.geometry = new THREE.SphereGeometry(3, 64, 64);
    this.material = new THREE.MeshStandardMaterial({
      color: '#00ff83',
      roughness: 0.3,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // 오르빗 컨트롤
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 10;

    this.scene.add(this.mesh);
    this.scene.add(this.light);
    this.renderer.render(this.scene, this.camera);

    this.setupResize();
    this.render();
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
    this.controls.update();
    window.requestAnimationFrame(this.render.bind(this));
  }
}

// new Sketch({
// 	dom: document.getElementById("container"),
// });
