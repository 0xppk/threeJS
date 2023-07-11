import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import GUI from 'lil-gui';

import vertexShader from '../practice/shaders/vertex.glsl';
import fragmentShader from '../practice/shaders/fragment.glsl';

import image from '../asset/image.jpg';

const container = document.querySelector('#container');
const width = container.offsetWidth;
const height = container.offsetHeight;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.setSize(width, height);
renderer.setClearColor(0x111111, 1);
container.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 100);
camera.position.z = 10;

const controls = new OrbitControls(camera, renderer.domElement);
const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uRadius: { value: 0.5 },
    uTexture: { value: new THREE.TextureLoader().load(image) },
  },
});

const gui = new GUI();
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'x', 0, 10);
cameraFolder.open();
gui.add(material.uniforms.uRadius, 'value').min(0).max(1);

const obje = new THREE.Mesh(geometry, material);
scene.add(obje);

renderer.render(scene, camera);

function render() {
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

render();
