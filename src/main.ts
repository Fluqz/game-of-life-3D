import { BufferGeometry, InstancedMesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer, BoxGeometry, Matrix4, Group, Vector2, MeshNormalMaterial, DirectionalLight, Material, Mesh } from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GameOfLife } from "./game-of-life"

import './style.css'

let container: HTMLElement
let renderer: WebGLRenderer
let camera: PerspectiveCamera
let scene: Scene
let orbit: OrbitControls

let group: Group

let width: number
let height: number
let ratio: number

let light

  // Variables for timer
let interval = 50
let lastRecordedTime = Date.now()

let gol: GameOfLife

    // Pause
let pause: boolean = false

let instacedMesh: InstancedMesh
let geometry: BufferGeometry
let material: Material

let boundingbox: Mesh

let cubeSide: number = 80

const init = () => {

  // @ts-ignore
  container = document.querySelector('#webGL')

  width = window.innerWidth
  height = window.innerHeight
  ratio = window.devicePixelRatio
  
  renderer = new WebGLRenderer({ antialias: true })
  renderer.setClearColor(0xEEEEEE)
  camera = new PerspectiveCamera(75, width / height, .1, 1000)
  scene = new Scene()
  orbit = new OrbitControls(camera, renderer.domElement)

  container.append(renderer.domElement)

  group = new Group()
  scene.add(group)

  light = new DirectionalLight(0xFFFFFF, .7)
  light.position.set(-100, 300, -100)
  scene.add(light)

  gol = new GameOfLife(cubeSide, cubeSide, cubeSide)

  boundingbox = new Mesh(new BoxGeometry(cubeSide, cubeSide, cubeSide), new MeshBasicMaterial({ color: 0x000000, wireframe: true }))
  scene.add(boundingbox)

  // scene.add(new GridHelper(gol.width, gol.width / gol.cellSize))
  camera.position.set(gol.width, gol.height, gol.depth)

  geometry = new BoxGeometry(gol.cellSize, gol.cellSize, gol.cellSize)
  geometry.translate(gol.cellSize / 2, gol.cellSize / 2, gol.cellSize / 2)
  material = new MeshNormalMaterial()

  material.onBeforeCompile = ( shader ) => {

    
    shader.uniforms.textures = {
      // @ts-ignore
      time: { value: 1.0 },
		  resolution: { value: new Vector2(width, height) }
    }

    shader.vertexShader = shader.vertexShader

    shader.fragmentShader = shader.fragmentShader
  }
  
  instacedMesh = new InstancedMesh(geometry, material, gol.width * gol.height * gol.depth)
  group.add(instacedMesh)

  group.position.set(-gol.width * gol.cellSize / 2, -gol.height * gol.cellSize / 2, -gol.depth * gol.cellSize / 2)

  let index = 0
  let matrix = new Matrix4()
  for (let x = 0; x < gol.width / gol.cellSize; x++) {

    for (let y = 0; y < gol.height / gol.cellSize; y++) {

      for (let z = 0; z < gol.depth / gol.cellSize; z++) {

        matrix.setPosition(x * gol.cellSize, y * gol.cellSize, z * gol.cellSize)

        instacedMesh.setMatrixAt(index, matrix)

        index++
      }
    }
  }

  resize()

  draw()

  window.addEventListener('resize', resize)
}

const loop = () => {

  requestAnimationFrame(loop)
  if(Date.now() - lastRecordedTime >= interval) {

    console.log('gen', gol.generation)
    step()
    lastRecordedTime = Date.now()
  }

  orbit.update()

  renderer.render(scene, camera)
}

const resize = () => {

  width = window.innerWidth
  height = window.innerHeight
  ratio = window.devicePixelRatio

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
  renderer.setPixelRatio(ratio)
}

const step = () => {

  if(pause) return

  gol.iterate()

  draw()

  if(gol.done) gol.reset()
}

const draw = () => {

  let index = 0
  let matrix = new Matrix4()

  //Draw grid
  for (let x = 0; x < gol.width / gol.cellSize; x++) {

    for (let y = 0; y < gol.height / gol.cellSize; y++) {

      for (let z = 0; z < gol.depth / gol.cellSize; z++) {

        if (gol.cellsBuffer[x][y][z] != gol.cells[x][y][z] && gol.cells[x][y][z].state == true) {

          matrix.setPosition(x * gol.cellSize, y * gol.cellSize, z * gol.cellSize)
          instacedMesh.setMatrixAt(index, matrix)

          instacedMesh.instanceMatrix.needsUpdate = true
        }
        else if(gol.cellsBuffer[x][y][z] != gol.cells[x][y][z]) {
          // If dead
          matrix.setPosition(-100 * cubeSide, 100 * cubeSide, 100 * cubeSide)
          instacedMesh.setMatrixAt(index, matrix)

          instacedMesh.instanceMatrix.needsUpdate = true
        }

        index++
      }
    }
  }
}

// @ts-ignore
let togglePause = () => {

  pause = !pause
}

init()
loop()

document.addEventListener('mousedown', () => {


  // gol.clear()
})


export {}