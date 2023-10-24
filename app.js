import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader' 
import GUI from 'lil-gui'
import gsap from 'gsap'
import fragmentShader from './shaders/fragment.glsl'
import vertexShader from './shaders/vertex.glsl'


import fragmentShader1 from './shaders/fragment copy.glsl'
import vertexShader1 from './shaders/vertex copy.glsl'
 
import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer'
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass'
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass'
import {GlitchPass} from 'three/examples/jsm/postprocessing/GlitchPass'

import { createNoise3D } from 'simplex-noise';
import alea from 'alea';
const noise3D = createNoise3D(alea('seed'))

function computeCurl(x,y,z) {
	var eps = 0.0001
	var curl = new THREE.Vector3()


	var n1 = noise3D(x, y + eps, z)
	var n2 = noise3D(x, y - eps, z)

	var a = (n1 - n2) / (2 * eps)
	var n2 = noise3D(x, y, z + eps)
	var n2 = noise3D(x, y, z - eps)

	var b = (n1 - n2) / (2 * eps)
	curl.x = a - b

	n1 = noise3D(x, y, z + eps)
	n2 = noise3D(x, y, z - eps)
	a = (n1 - n2) / (2 * eps)
	n1 = noise3D(x + eps, y,z)
	n2 = noise3D(x + eps, y,z)
	b = (n1 - n2) / (2 * eps)
	curl.y = a - b

	n1 = noise3D(x + eps, y,z)
	n2 = noise3D(x - eps, y,z)
	a = (n1 - n2) / (2 * eps)
	n1 = noise3D(x, y + eps, z)
	n2 = noise3D(x, y - eps, z)
	b = (n1 - n2) / (2 * eps)
	curl.z = a - b

	return curl


}

console.log(computeCurl(0, 0, 0))


export default class Sketch {
	constructor(options) {
		
		this.scene = new THREE.Scene()
		this.scene1 = new THREE.Scene()
		
		this.container = options.dom
		
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		
		
		// // for renderer { antialias: true }
		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
		this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height)
		this.renderer.setSize(this.width ,this.height )
		this.renderer.setClearColor(0x000000, 1)
		this.renderer.useLegacyLights = true
		this.renderer.outputEncoding = THREE.sRGBEncoding
		this.renderer.autoClear = false
		this.raycaster = new THREE.Raycaster()
		this.mouse = new THREE.Vector2()

		this.eMouse = new THREE.Vector2()
		this.elasticMouse = new THREE.Vector2(0,0)
		this.temp = new THREE.Vector2(0,0)

		this.elasticMouseVel = new THREE.Vector2(0,0)
 

		 
		this.renderer.setSize( window.innerWidth, window.innerHeight )

		this.container.appendChild(this.renderer.domElement)
 


		this.camera = new THREE.PerspectiveCamera( 70,
			 this.width / this.height,
			 0.01,
			 100
		)
 
		this.camera.position.set(0, 0, 2) 
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		this.time = 0


		this.dracoLoader = new DRACOLoader()
		this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
		this.gltf = new GLTFLoader()
		this.gltf.setDRACOLoader(this.dracoLoader)

		this.isPlaying = true
 
		this.addObjects()		 
		this.raycast()
		this.resize()
		this.render()
		this.setupResize()
 
 
	}

	raycast() {
		this.raycastPlane = new THREE.Mesh(
			new THREE.PlaneGeometry(10, 10),
			this.material
			// new THREE.MeshBasicMaterial({color: 0xcb0d02})
		) 

		this.light = new THREE.Mesh(
			new THREE.SphereGeometry(0.02, 20, 20),
			new THREE.MeshBasicMaterial({color: 0xa8e6cf})
		) 
		this.scene1.add(this.raycastPlane)
		this.scene.add(this.light)


		this.container.addEventListener('mousemove', event => {
			this.mouse.x = (event.clientX / this.width) * 2 - 1
			this.mouse.y = - (event.clientY /this.height) * 2 + 1



			this.raycaster.setFromCamera(this.mouse, this.camera)
			this.eMouse.x = event.clientX
			this.eMouse.y = event.clientY



			const intersects = this.raycaster.intersectObjects([this.raycastPlane])
			if(intersects.length > 0) {
				let p  = intersects[0].point
 
				this.eMouse.x = p.x
				this.eMouse.y = p.y
	 

				// console.log(p)
			}
	
		})
 
	}



	settings() {
		let that = this
		this.settings = {
			progress: 0
		}
		this.gui = new GUI()
		this.gui.add(this.settings, 'progress', 0, 1, 0.01)
	}

	setupResize() {
		window.addEventListener('resize', this.resize.bind(this))
	}

	resize() {
		this.width = this.container.offsetWidth
		this.height = this.container.offsetHeight
		this.renderer.setSize(this.width, this.height)
		this.camera.aspect = this.width / this.height


		this.imageAspect = 853/1280
		let a1, a2
		if(this.height / this.width > this.imageAspect) {
			a1 = (this.width / this.height) * this.imageAspect
			a2 = 1
		} else {
			a1 = 1
			a2 = (this.height / this.width) / this.imageAspect
		} 


		this.material.uniforms.resolution.value.x = this.width
		this.material.uniforms.resolution.value.y = this.height
		this.material.uniforms.resolution.value.z = a1
		this.material.uniforms.resolution.value.w = a2

		this.camera.updateProjectionMatrix()



	}
	 

 

	addObjects() {
		let that = this
		this.material = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				uLight: {value: new THREE.Vector3(0,0,0)},
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader,
			fragmentShader
		})

		this.materialTubes = new THREE.ShaderMaterial({
			extensions: {
				derivatives: '#extension GL_OES_standard_derivatives : enable'
			},
			side: THREE.DoubleSide,
			uniforms: {
				time: {value: 0},
				uLight: {value: new THREE.Vector3(0,0,0)},
				resolution: {value: new THREE.Vector4()}
			},
			vertexShader: vertexShader1,
			fragmentShader: fragmentShader1
		})
		
		
		this.geometry = new THREE.PlaneGeometry(1,1,1,1)


		for (let i = 0; i < 300; i++) {
			let path = new THREE.CatmullRomCurve3(this.getCurve( new THREE.Vector3(
				Math.random() - 0.5,
				Math.random() - 0.5,

				Math.random() - 0.5,

			)))

			let geometry = new THREE.TubeGeometry(path, 600, 0.005, 8, false)
	
			let curve = new THREE.Mesh(geometry, this.materialTubes)
	 
	 
			this.scene.add(curve)
	 
			
		}

 
	}



	addLights() {
		const light1 = new THREE.AmbientLight(0xeeeeee, 0.5)
		this.scene.add(light1)
	
	
		const light2 = new THREE.DirectionalLight(0xeeeeee, 0.5)
		light2.position.set(0.5,0,0.866)
		this.scene.add(light2)
	}
	getCurve(start) {
		let scale = 1
		let points = []

		points.push(start)
		 
		let currentPoint = start.clone()
		 
		for (let i = 0; i < 600; i++) {
		 
			let v = computeCurl(currentPoint.x / scale, currentPoint.y / scale, currentPoint.z / scale) 
			// console.log(v)

			currentPoint.addScaledVector(v, 0.001)

			points.push(currentPoint.clone())




			// points.push(new THREE.Vector3( Math.sin( 50 * i / 10), i / 10,0))
			
		}
		return points
	}
	stop() {
		this.isPlaying = false
	}

	play() {
		if(!this.isPlaying) {
			this.isPlaying = true
			this.render()
		}
	}

	render() {
		if(!this.isPlaying) return
		this.time += 0.05





		// document.querySelector('.cursor').style.transform = `translate(${this.elasticMouse.x}px, ${this.elasticMouse.y}px)`


		this.temp.copy(this.eMouse).sub(this.elasticMouse).multiplyScalar(.15)
		this.elasticMouseVel.add(this.temp)
		this.elasticMouseVel.multiplyScalar(.8)
		this.elasticMouse.add(this.elasticMouseVel)

		this.materialTubes.uniforms.time.value = this.time

		this.material.uniforms.time.value = this.time
		
		this.light.position.x = this.elasticMouse.x
		this.light.position.y = this.elasticMouse.y 


		this.material.uniforms.uLight.value = this.light.position
		this.materialTubes.uniforms.uLight.value = this.light.position


		//this.renderer.setRenderTarget(this.renderTarget)
	 
		//this.renderer.setRenderTarget(null)

		this.renderer.clear()
		this.renderer.render(this.scene1, this.camera)
		this.renderer.clearDepth()
		this.renderer.render(this.scene, this.camera)


		requestAnimationFrame(this.render.bind(this))
	}
 
}
new Sketch({
	dom: document.getElementById('container')
})
 