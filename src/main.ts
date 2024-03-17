import { BufferGeometry, InstancedMesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer, BoxGeometry, Matrix4, Group, MeshNormalMaterial, DirectionalLight, Material, Mesh } from "three"
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GameOfLife } from "./game-of-life"

import Stats from 'three/examples/jsm/libs/stats.module'
// @ts-ignore
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js'

import './style.css'

let stats: Stats
let gui: GUI

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


let gol: GameOfLife

    // Pause
let pause: boolean = false

let instacedMesh: InstancedMesh
let geometry: BufferGeometry
let material: Material

let boundingbox: Mesh

let cubeSide: number = 80

let fps = 1

const init = () => {

  // Game of Life instance
  gol = new GameOfLife(cubeSide, cubeSide, cubeSide)

  // STATS PANEL
  stats = Stats()
  stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild( stats.dom );

  // GUI PANEL
  const FPSParam = {
    maxFPS: fps
  }

  gui = new GUI()
  let fpsFolder = gui.addFolder('FPS')
  fpsFolder.add(FPSParam, 'maxFPS', 0, 60, .1).name( 'Max FPS' ).onChange((v:number) => { 

    fps = v
    frameRate = 1000 / fps
  })

  let rulesFolder = gui.addFolder('Rules')
  let deathRulesFolder = rulesFolder.addFolder('Dies')
  deathRulesFolder.add(gol.rules.alive, 'minNeighbours', 0, 8, 1).name('min neighbours')
  deathRulesFolder.add(gol.rules.alive, 'maxNeighbours', 0, 8, 1).name('max neighbours')
  let resurrectRulesFolder = rulesFolder.addFolder('Resurrect')
  resurrectRulesFolder.add(gol.rules.dead, 'maxNeighbours', 0, 8, 1).name('neighbours')

  const resetParam = {
    reset: gol.reset
  }
  gui.add(resetParam, 'reset').name('Reset')

  const pauseParam = {
    pause: togglePause
  }
  gui.add(pauseParam, 'pause').name('Pause')
  
  
  // Setup
  // @ts-ignore
  container = document.querySelector('#webGL')

  width = window.innerWidth
  height = window.innerHeight
  ratio = window.devicePixelRatio
  
  renderer = new WebGLRenderer({ antialias: true })
  renderer.setClearColor(0xEEEEEE)
  camera = new PerspectiveCamera(75, width / height, .1, 1000)
  camera.position.set(gol.width, gol.height, gol.depth)
  // scene.add(new GridHelper(gol.width, gol.width / gol.cellSize))
  scene = new Scene()
  orbit = new OrbitControls(camera, renderer.domElement)

  container.append(renderer.domElement)


  // Scene and Objects
  group = new Group()
  group.position.set(-gol.width * gol.cellSize / 2, -gol.height * gol.cellSize / 2, -gol.depth * gol.cellSize / 2)
  scene.add(group)

  // Boundingbox Mesh
  boundingbox = new Mesh(new BoxGeometry(cubeSide, cubeSide, cubeSide), new MeshBasicMaterial({ color: 0x000000, wireframe: true }))
  scene.add(boundingbox)

  // Light
  light = new DirectionalLight(0xFFFFFF, .7)
  light.position.set(-100, 300, -100)
  scene.add(light)



  // Create Mesh
  geometry = new BoxGeometry(gol.cellSize, gol.cellSize, gol.cellSize)
  geometry.translate(gol.cellSize / 2, gol.cellSize / 2, gol.cellSize / 2)
  material = new MeshNormalMaterial()

  // Instanced Mesh
  instacedMesh = new InstancedMesh(geometry, material, gol.width * gol.height * gol.depth)
  group.add(instacedMesh)

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

  renderer.render(scene, camera)

  window.addEventListener('resize', resize)
}

const loop = () => {

  requestAnimationFrame(loop)

  // console.log('frame', Date.now())



  stats.begin()


  // console.log('Generation', gol.generation)

  orbit.update()

  step()

  renderer.render(scene, camera)


  stats.end()
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

let frameRate = 1000 / fps
let time = Date.now()
const step = () => {

  if(pause) return


  if(time + frameRate < Date.now()) {

    // console.log('step', Date.now())


    gol.iterate()

    draw()
    
    if(gol.done) gol.reset()


    time = Date.now()
  }
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