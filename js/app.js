import * as THREE from "three";
import GUI from "lil-gui";

import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

import simFragment from "./shaders/simFragment.glsl";
import simVertex from "./shaders/simVertex.glsl";

import texture from "../asset/test.jpg";
import t1 from "../asset/logo.png";
import t2 from "../asset/super.png";

function lerp(s, e, t) {
	return s + (e - s) * t;
}

function loadImage(path) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.src = path;
		img.onload = () => resolve(img);
		img.onerror = (e) => reject(e);
	});
}

export default class Sketch {
	constructor(options) {
		this.container = options.dom;
		this.scene = new THREE.Scene();

		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;

		this.size = 128 * 4;
		this.number = this.size * this.size;

		this.raycaster = new THREE.Raycaster();
		this.pointer = new THREE.Vector2();

		this.renderer = new THREE.WebGLRenderer({
			alpha: true,
		});
		this.renderer.setClearColor(0x222222, 1);
		this.renderer.setSize(this.width, this.height);
		this.container.appendChild(this.renderer.domElement);

		this.camera = new THREE.PerspectiveCamera(
			70,
			this.width / this.height,
			0.01,
			10,
		);
		this.camera.position.z = 1;

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);

		this.setupSettings();

		this.time = 0;

		Promise.all([
			this.getPixelDataFromImage(t1),
			this.getPixelDataFromImage(t2),
		]).then((texture) => {
			this.data1 = texture[0];
			this.data2 = texture[1];
			this.mouseEvents();
			this.setupFBO();
			this.addObjects();
			this.setupResize();
			this.render();
		});
	}

	setupResize() {
		window.addEventListener("resize", this.resize.bind(this));
	}
	setupSettings() {
		this.settings = {
			progress: 0,
		};

		this.gui = new GUI();
		this.gui.add(this.settings, "progress", 0, 1, 0.01).onChange((val) => {
			this.simMaterial.uniforms.uProgress.value = val;
		});
	}

	async getPixelDataFromImage(url) {
		let img = await loadImage(url);
		let width = 200;
		let canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = width;
		let ctx = canvas.getContext("2d");
		ctx.drawImage(img, 0, 0, width, width);

		let canvasData = ctx.getImageData(0, 0, width, width).data;
		let pixels = [];
		for (let i = 0; i < canvasData.length; i += 4) {
			let x = (i / 4) % width;
			let y = Math.floor(i / 4 / width);

			if (canvasData[i] < 5) {
				pixels.push({ x: x / width - 0.5, y: 0.5 - y / width });
			}
		}

		// create data Texture
		const data = new Float32Array(4 * this.number);
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const index = i * this.size + j;
				let randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
				if (Math.random() > 0.9) {
					randomPixel = {
						x: (Math.random() - 0.5) * 3,
						y: (Math.random() - 0.5) * 3,
					};
				}
				data[4 * index] = randomPixel.x + (Math.random() - 0.5) * 0.01;
				data[4 * index + 1] = randomPixel.y + (Math.random() - 0.5) * 0.01;
				data[4 * index + 2] = (Math.random() - 0.5) * 0.01;
				data[4 * index + 3] = (Math.random() - 0.5) * 0.01;
			}
		}

		let dataTexture = new THREE.DataTexture(
			data,
			this.size,
			this.size,
			THREE.RGBAFormat,
			THREE.FloatType,
		);
		dataTexture.needsUpdate = true;

		return dataTexture;
	}

	mouseEvents() {
		this.planeMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(10, 10),
			new THREE.MeshBasicMaterial(),
		);

		this.dummy = new THREE.Mesh(
			new THREE.SphereGeometry(0.01, 32, 32),
			new THREE.MeshNormalMaterial(),
		);

		this.scene.add(this.dummy);

		window.addEventListener("pointermove", (e) => {
			this.pointer.x = -1 + (e.clientX / window.innerWidth) * 2;
			this.pointer.y = 1 - (e.clientY / window.innerHeight) * 2;
			this.raycaster.setFromCamera(this.pointer, this.camera);

			const intersects = this.raycaster.intersectObjects([this.planeMesh]);
			if (intersects.length > 0) {
				this.dummy.position.copy(intersects[0].point);
				this.simMaterial.uniforms.uMousePosition.value = intersects[0].point;
			}
		});
	}

	setupFBO() {
		// create FBO scene
		this.sceneFBO = new THREE.Scene();
		this.cameraFBO = new THREE.OrthographicCamera(-1, 1, 1, -1, -2, 2);
		this.cameraFBO.position.z = 1;
		this.cameraFBO.lookAt(new THREE.Vector3(0, 0, 0));

		let geo = new THREE.PlaneGeometry(2, 2, 2, 2);
		this.simMaterial = new THREE.MeshBasicMaterial({
			color: 0xff0000,
			wireframe: true,
		});
		this.simMaterial = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				uMousePosition: { value: new THREE.Vector3(0, 0, 0) },
				uProgress: { value: 0 },
				uTime: { value: 0 },
				uCurrentPosition: { value: this.data1 },
				uOriginalPosition: { value: this.data1 },
				uOriginalPosition1: { value: this.data2 },
			},
			vertexShader: simVertex,
			fragmentShader: simFragment,
		});
		this.simMesh = new THREE.Mesh(geo, this.simMaterial);
		this.sceneFBO.add(this.simMesh);

		this.renderTarget = new THREE.WebGLRenderTarget(this.size, this.size, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
		});

		this.renderTarget1 = new THREE.WebGLRenderTarget(this.size, this.size, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
		});
	}

	resize() {
		this.width = this.container.offsetWidth;
		this.height = this.container.offsetHeight;

		this.renderer.setSize(this.width, this.height);
		this.camera.aspect = this.width / this.height;

		this.camera.updateProjectionMatrix();
	}

	addObjects() {
		this.geometry = new THREE.BufferGeometry();
		const positions = new Float32Array(this.number * 3);
		const uvs = new Float32Array(this.number * 2);
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const index = i * this.size + j;

				positions[3 * index] = j / this.size - 0.5;
				positions[3 * index + 1] = i / this.size - 0.5;
				positions[3 * index + 2] = 0;
				uvs[2 * index] = j / (this.size - 1);
				uvs[2 * index + 1] = i / (this.size - 1);
			}
		}
		this.geometry.setAttribute(
			"position",
			new THREE.BufferAttribute(positions, 3),
		);
		this.geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

		this.material = new THREE.MeshNormalMaterial();

		this.material = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				// uTexture: { value: new THREE.TextureLoader().load(texture) },
				uTexture: { value: this.positions },
			},
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			depthWrite: false,
			depthTest: false,
			transparent: true,
		});

		this.mesh = new THREE.Points(this.geometry, this.material);
		this.scene.add(this.mesh);
	}

	render() {
		this.time += 0.05;

		this.material.uniforms.time.value = this.time;

		// this.renderer.render(this.scene, this.camera);
		// this.renderer.render(this.sceneFBO, this.cameraFBO);

		this.renderer.setRenderTarget(this.renderTarget);
		this.renderer.render(this.sceneFBO, this.cameraFBO);

		this.renderer.setRenderTarget(null);
		this.renderer.render(this.scene, this.camera);

		// swap render targets
		const tmp = this.renderTarget;
		this.renderTarget = this.renderTarget1;
		this.renderTarget1 = tmp;

		this.material.uniforms.uTexture.value = this.renderTarget.texture;
		this.simMaterial.uniforms.uCurrentPosition.value =
			this.renderTarget1.texture;
		this.simMaterial.uniforms.uTime.value = this.time;

		window.requestAnimationFrame(this.render.bind(this));
	}
}

new Sketch({
	dom: document.getElementById("container"),
});
