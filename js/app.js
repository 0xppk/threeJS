import * as THREE from "three";
import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationREnderer.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

import simFragmentPosition from "./shaders/simFragmentPosition.glsl";
import simFragmentVelocity from "./shaders/simFragmentVelocity.glsl";
import simVertex from "./shaders/simVertex.glsl";

import suzanne from "../asset/d.glb?url";

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
		this.loader = new GLTFLoader();
		this.time = 0;
		this._position = new THREE.Vector3();

		this.setupSettings();

		Promise.all([this.loader.loadAsync(suzanne)]).then(([model]) => {
			this.suzanne = model.scene.children[0];
			this.suzanne.geometry.rotateX(-Math.PI / 2);
			this.suzanne.material = new THREE.MeshNormalMaterial();
			this.sampler = new MeshSurfaceSampler(this.suzanne).build();

			// this.scene.add(this.suzanne);
			this.data1 = this.getVelocitiesOnSphere();
			this.data2 = this.getVelocitiesOnSphere();
			this.mouseEvents();
			this.setupFBO();
			this.initGPGPU();
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

	getVelocitiesOnSphere() {
		// create data Texture
		const data = new Float32Array(4 * this.number);
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const index = i * this.size + j;

				// generate point on a sphere
				let theta = Math.random() * Math.PI * 2;
				let phi = Math.acos(Math.random() * 2 - 1);
				// let phi = Math.random() * Math.PI
				let x = Math.sin(phi) * Math.cos(theta);
				let y = Math.sin(phi) * Math.sin(theta);
				let z = Math.cos(phi);

				data[4 * index] = 0;
				data[4 * index + 1] = 0;
				data[4 * index + 2] = 0;
				data[4 * index + 3] = 0;
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

	getPointsOnSphere() {
		const data = new Float32Array(4 * this.number);
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const index = i * this.size + j;

				// generate point on a sphere
				let theta = Math.random() * Math.PI * 2;
				let phi = Math.acos(Math.random() * 2 - 1); //
				// let phi = Math.random()*Math.PI; //
				let x = Math.sin(phi) * Math.cos(theta);
				let y = Math.sin(phi) * Math.sin(theta);
				let z = Math.cos(phi);

				data[4 * index] = x;
				data[4 * index + 1] = y;
				data[4 * index + 2] = z;
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

	getPointsOnSuzanne() {
		const data = new Float32Array(4 * this.number);
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const index = i * this.size + j;

				this.sampler.sample(this._position);
				// generate point on a sphere
				// let theta = Math.random() * Math.PI * 2;
				// let phi = Math.acos(Math.random() * 2 - 1); //
				// let phi = Math.random()*Math.PI; //
				// let x = Math.sin(phi) * Math.cos(theta);
				// let y = Math.sin(phi) * Math.sin(theta);
				// let z = Math.cos(phi);

				data[4 * index] = this._position.x;
				data[4 * index + 1] = this._position.y;
				data[4 * index + 2] = this._position.z;
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
		this.raycasterMesh = new THREE.Mesh(
			this.suzanne.geometry,
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

			const intersects = this.raycaster.intersectObjects([this.raycasterMesh]);
			if (intersects.length > 0) {
				this.dummy.position.copy(intersects[0].point);
				this.simMaterial.uniforms.uMouse.value = intersects[0].point;
				this.positionUniforms.uMouse.value = intersects[0].point;
				this.velocityUniforms.uMouse.value = intersects[0].point;
			}
		});
	}

	initGPGPU() {
		this.gpuCompute = new GPUComputationRenderer(
			this.size,
			this.size,
			this.renderer,
		);

		this.pointsOnSphere = this.getPointsOnSuzanne();

		this.positionVariable = this.gpuCompute.addVariable(
			"uCurrentPosition",
			simFragmentPosition,
			this.pointsOnSphere,
		);

		this.velocityVariable = this.gpuCompute.addVariable(
			"uCurrentVelocity",
			simFragmentVelocity,
			this.getVelocitiesOnSphere(),
		);

		this.gpuCompute.setVariableDependencies(this.positionVariable, [
			this.positionVariable,
			this.velocityVariable,
		]);
		this.gpuCompute.setVariableDependencies(this.velocityVariable, [
			this.positionVariable,
			this.velocityVariable,
		]);

		this.positionUniforms = this.positionVariable.material.uniforms;
		this.velocityUniforms = this.velocityVariable.material.uniforms;

		this.positionUniforms.uTime = { value: 0.0 };
		this.velocityUniforms.uTime = { value: 0.0 };
		this.positionUniforms.uMouse = { value: new THREE.Vector3(0, 0, 0) };
		this.velocityUniforms.uMouse = { value: new THREE.Vector3(0, 0, 0) };
		this.positionUniforms.uOriginalPosition = { value: this.pointsOnSphere };
		this.velocityUniforms.uOriginalPosition = { value: this.pointsOnSphere };

		this.gpuCompute.init();
	}

	setupFBO() {
		// create data Texture
		const data = new Float32Array(4 * this.number);
		for (let i = 0; i < this.size; i++) {
			for (let j = 0; j < this.size; j++) {
				const index = i * this.size + j;
				data[4 * index] = lerp(-0.5, 0.5, j / (this.size - 1));
				data[4 * index + 1] = lerp(-0.5, 0.5, i / (this.size - 1));
				data[4 * index + 2] = 0;
				data[4 * index + 3] = 1;
			}
		}

		this.positions = new THREE.DataTexture(
			data,
			this.size,
			this.size,
			THREE.RGBAFormat,
			THREE.FloatType,
		);
		this.positions.needsUpdate = true;

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
				uMouse: { value: new THREE.Vector3(0, 0, 0) },
				uProgress: { value: 0 },
				uTime: { value: 0 },
				uCurrentPosition: { value: this.data1 },
				uOriginalPosition: { value: this.data1 },
				uOriginalPosition1: { value: this.data2 },
			},
			vertexShader: simVertex,
			fragmentShader: simFragmentPosition,
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

		// this.renderer.setRenderTarget(this.renderTarget);
		// this.renderer.render(this.sceneFBO, this.cameraFBO);

		// this.renderer.setRenderTarget(null);
		this.gpuCompute.compute();
		this.renderer.render(this.scene, this.camera);

		// swap render targets
		// const tmp = this.renderTarget;
		// this.renderTarget = this.renderTarget1;
		// this.renderTarget1 = tmp;

		this.material.uniforms.uTexture.value =
			this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
		this.positionUniforms.uTime.value = this.time;

		// this.simMaterial.uniforms.uCurrentPosition.value =
		// this.renderTarget1.texture;
		// this.simMaterial.uniforms.uTime.value = this.time;

		window.requestAnimationFrame(this.render.bind(this));
	}
}

new Sketch({
	dom: document.getElementById("container"),
});
