// src/pages/index.tsx
import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'

export default function Home() {
  const mountRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<PointerLockControls | null>(null)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.y = 2 // Set initial height
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x87CEEB) // Sky blue color
    mountRef.current.appendChild(renderer.domElement)

    // Controls
    controlsRef.current = new PointerLockControls(camera, renderer.domElement)
    scene.add(controlsRef.current.getObject())

    // Movement
    const velocity = new THREE.Vector3()
    const direction = new THREE.Vector3()
    let moveForward = false
    let moveBackward = false
    let moveLeft = false
    let moveRight = false
    let canJump = false

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': moveForward = true; break
        case 'KeyA': moveLeft = true; break
        case 'KeyS': moveBackward = true; break
        case 'KeyD': moveRight = true; break
        case 'Space': if (canJump) velocity.y += 350; canJump = false; break
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': moveForward = false; break
        case 'KeyA': moveLeft = false; break
        case 'KeyS': moveBackward = false; break
        case 'KeyD': moveRight = false; break
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('keyup', onKeyUp)

    // Textures
    const textureLoader = new THREE.TextureLoader()
    const grassTexture = textureLoader.load('/grass.jpg')
    grassTexture.wrapS = THREE.RepeatWrapping
    grassTexture.wrapT = THREE.RepeatWrapping
    grassTexture.repeat.set(10, 10)

    const brickTexture = textureLoader.load('/brick.jpg')
    brickTexture.wrapS = THREE.RepeatWrapping
    brickTexture.wrapT = THREE.RepeatWrapping
    brickTexture.repeat.set(5, 1)

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(100, 100)
    const groundMaterial = new THREE.MeshLambertMaterial({ map: grassTexture })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    // Walls
    const wallMaterial = new THREE.MeshLambertMaterial({ map: brickTexture })
    const createWall = (width: number, height: number, depth: number, x: number, y: number, z: number) => {
      const wallGeometry = new THREE.BoxGeometry(width, height, depth)
      const wall = new THREE.Mesh(wallGeometry, wallMaterial)
      wall.position.set(x, y, z)
      scene.add(wall)
      return wall
    }

    // Create a simple map
    const walls = [
      createWall(100, 10, 2, 0, 5, -50), // Back wall
      createWall(100, 10, 2, 0, 5, 50), // Front wall
      createWall(2, 10, 100, -50, 5, 0), // Left wall
      createWall(2, 10, 100, 50, 5, 0), // Right wall
      createWall(20, 10, 2, -20, 5, -20), // Internal wall 1
      createWall(2, 10, 40, 20, 5, -10), // Internal wall 2
    ]

    // Trees
    const treeGeometry = new THREE.ConeGeometry(5, 20, 32)
    const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 })
    const trunkGeometry = new THREE.CylinderGeometry(1, 1, 10, 32)
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 })

    for (let i = 0; i < 10; i++) {
      const treeTop = new THREE.Mesh(treeGeometry, treeMaterial)
      const treeTrunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
      treeTop.position.set(
        Math.random() * 80 - 40,
        15,
        Math.random() * 80 - 40
      )
      treeTrunk.position.set(
        treeTop.position.x,
        5,
        treeTop.position.z
      )
      scene.add(treeTop)
      scene.add(treeTrunk)
    }

    // Targets
    const targetGeometry = new THREE.SphereGeometry(1, 32, 32)
    const targetMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 })
    const targets: THREE.Mesh[] = []

    for (let i = 0; i < 5; i++) {
      const target = new THREE.Mesh(targetGeometry, targetMaterial)
      target.position.set(
        Math.random() * 80 - 40,
        Math.random() * 5 + 2,
        Math.random() * 80 - 40
      )
      scene.add(target)
      targets.push(target)
    }

    // Gun
    const gunGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.3)
    const gunMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 })
    const gun = new THREE.Mesh(gunGeometry, gunMaterial)
    gun.position.set(0.3, -0.3, -0.5)
    camera.add(gun)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(100, 100, 0)
    scene.add(directionalLight)

    // Shooting mechanism
    const raycaster = new THREE.Raycaster()
    const shoot = () => {
      if (controlsRef.current) {
        raycaster.setFromCamera(new THREE.Vector2(), camera)
        const intersects = raycaster.intersectObjects(targets)
        if (intersects.length > 0) {
          const hitTarget = intersects[0].object as THREE.Mesh
          scene.remove(hitTarget)
          targets.splice(targets.indexOf(hitTarget), 1)
          setScore(prevScore => prevScore + 1)

          // Respawn target
          if (targets.length < 5) {
            const newTarget = new THREE.Mesh(targetGeometry, targetMaterial)
            newTarget.position.set(
              Math.random() * 80 - 40,
              Math.random() * 5 + 2,
              Math.random() * 80 - 40
            )
            scene.add(newTarget)
            targets.push(newTarget)
          }
        }
      }
    }

    window.addEventListener('click', shoot)

    // Animation
    const clock = new THREE.Clock()
    function animate() {
      requestAnimationFrame(animate)

      if (controlsRef.current?.isLocked) {
        const delta = clock.getDelta()

        velocity.x -= velocity.x * 10.0 * delta
        velocity.z -= velocity.z * 10.0 * delta
        velocity.y -= 9.8 * 100.0 * delta // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward)
        direction.x = Number(moveRight) - Number(moveLeft)
        direction.normalize() // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta

        controlsRef.current.moveRight(-velocity.x * delta)
        controlsRef.current.moveForward(-velocity.z * delta)

        controlsRef.current.getObject().position.y += (velocity.y * delta) // new behavior
        if (controlsRef.current.getObject().position.y < 2) {
          velocity.y = 0
          controlsRef.current.getObject().position.y = 2
          canJump = true
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    function handleResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('click', shoot)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  const handleClick = () => {
    if (controlsRef.current) {
      controlsRef.current.lock()
    }
  }

  return (
    <div ref={mountRef} onClick={handleClick} style={{ width: '100vw', height: '100vh', cursor: 'crosshair' }}>
      <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white' }}>
        Click to start. Use WASD to move, Space to jump, mouse to look around, and left-click to shoot.
      </div>
      <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'white' }}>
        Score: {score}
      </div>
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '20px', height: '20px', border: '2px solid white', borderRadius: '50%', transform: 'translate(-50%, -50%)' }} />
    </div>
  )
}