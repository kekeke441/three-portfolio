import "./style.css"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import * as dat from "lil-gui"

/**
 * Debug
 */
const gui = new dat.GUI();

//get the canvas
const canvas = document.querySelector(".webgl")

/**
 * button
 */
const button = document.querySelector(".button")
let isAnimating = true;
button.addEventListener("click", () => {
  isAnimating = false;
  camera.position.set(1, 2, 1);

  setTimeout(() => {
    isAnimating = true;
    animate(); // アニメーションを再開させるために再度呼び出す
  }, 0);
  console.log("click");
})

let camera;

function init() {
  // Scene
  const scene = new THREE.Scene()

  //Sizes
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
  }

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    1000)

  camera.position.z = 4
  scene.add(camera);
  // Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
  })
  renderer.setSize(sizes.width, sizes.height)
  renderer.pixelRatio = Math.min(window.devicePixelRatio, 2)

  // object
  //material
  const material = new THREE.MeshPhysicalMaterial({
    color: "#3c94d7",
    metalness: 0.86,
    roughness: 0.37,
    flatShading: true,
  });

  const materialFolder = gui.addFolder("material");
  materialFolder.add(material, "metalness").min(0).max(1).step(0.01);
  materialFolder.add(material, "roughness").min(0).max(1).step(0.01);
  materialFolder.addColor(material, "color");

  /**
   * mesh
   */
  const torusMesh = new THREE.Mesh(new THREE.TorusGeometry(1, 0.4, 16, 60), material);
  const octahedronMesh = new THREE.Mesh(new THREE.OctahedronGeometry(), material);
  const torusKnotMesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16), material);
  const iccosahedronMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(), material);

  //position
  function initPosition() {
    torusMesh.position.set(2, 0, 0);
    octahedronMesh.position.set(-1, 0, 0);
    torusKnotMesh.position.set(2, 0, -6);
    iccosahedronMesh.position.set(5, 0, 3);
  }
  initPosition();

  scene.add(torusKnotMesh, iccosahedronMesh, torusMesh, octahedronMesh);
  const meshes = [torusMesh, octahedronMesh, torusKnotMesh, iccosahedronMesh];

  /**
   * gltf loader
   */
  function animateModel(child) {
    loadedObject.rotation.y += 0.0001;
    window.requestAnimationFrame(animateModel);
  }

  const gltfLoader = new GLTFLoader();
  let loadedObject, loadedObject2;
  let mixer; // Three.jsのアニメーションミキサー

  // Load a glTF resource
  gltfLoader.load(
    // resource URL
    //TODO: vercelで読み込めない    
    '/models/toonyama.glb',
    // called when the resource is loaded
    function (gltf) {
      loadedObject = gltf.scene;
      //TODO: cloneできない
      loadedObject2 = loadedObject.clone();
      loadedObject2.position.set(0, 0, 1);

      // console.log(gltf.scene); // モデルのルートオブジェクト
      // console.log(gltf.scene.children); // モデルの子オブジェクトの配列
      //position
      loadedObject.position.set(1, 0, 0);
      // Assuming loadedObject is a THREE.Group
      loadedObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Apply rotation to each mesh inside the group
          animateModel(child);
          console.log(child.name);
        }
      });


      scene.add(loadedObject, loadedObject2);
      console.log(loadedObject2.position);

      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Group
      gltf.scenes; // Array<THREE.Group>
      gltf.cameras; // Array<THREE.Camera>
      gltf.asset; // Object

      //animation
      // Assuming there is at least one animation in the glTF file
      if (gltf.animations && gltf.animations.length > 0) {
        // Create a mixer for the loadedObject
        mixer = new THREE.AnimationMixer(loadedObject);

        // Add all animations from gltf to the mixer
        const i = 0;
        const animation = gltf.animations[i];
        const action = mixer.clipAction(animation);
        action.setLoop(THREE.LoopPingPong);
        action.clampWhenFinished = true;
        action.play();

      }

    },
    // called while loading is progressing
    function (xhr) {

      console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    // called when loading has errors
    function (error) {

      console.error('An error happened', error);

    }
  );

  /**
   * particle
   */
  //geometry
  const particleGeometry = new THREE.BufferGeometry();
  const particleCount = 500;

  //material
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.01,
    color: "#ffffff",
    sizeAttenuation: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  //position
  const positionArray = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount * 3; i++) {
    positionArray[i] = (Math.random() - 0.5) * 10;
  }
  particleGeometry.setAttribute("position", new THREE.BufferAttribute(positionArray, 3));

  scene.add(new THREE.Points(particleGeometry, particleMaterial));

  /**
   * light
   */
  const light = new THREE.DirectionalLight(0xffffff, 4);
  light.position.set(0.5, 1, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  scene.add(light);

  /**
   * resize
   */
  window.addEventListener("resize", () => {
    //update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    //update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    //renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  /**
   * wheel
   */
  let speed = 0;
  let rotation = 0;
  window.addEventListener("wheel", (e) => {
    speed += e.deltaY * 0.0005;
  });

  const meshesCount = meshes.length;
  const offset = {
    x: 2,
    y: 0,
    z: -2,
    radius: 3,
  }
  const offsetFolder = gui.addFolder("offset");
  offsetFolder.add(offset, "radius").min(0).max(10).step(0.01);
  offsetFolder.add(offset, "x").min(-5).max(5).step(0.01);
  offsetFolder.add(offset, "z").min(-5).max(5).step(0.01);

  function rot() {
    rotation += speed;
    speed *= 0.9; //減速
    for (let i = 0; i < meshesCount; i++) {
      meshes[i].position.x = offset.x + Math.cos(rotation + i * Math.PI / 2) * offset.radius;
      meshes[i].position.z = offset.z + Math.sin(rotation + i * Math.PI / 2) * offset.radius;
    }
    window.requestAnimationFrame(rot);
  }

  rot();


  /**
   * cursor
   */
  const cursor = {
    x: 0,
    y: 0,
    speed: 0.1,
  };
  window.addEventListener("mousemove", (e) => {
    cursor.x = e.clientX / sizes.width - 0.5;
    cursor.y = e.clientY / sizes.height - 0.5;
  });
  const cursorFolder = gui.addFolder("cursor");
  cursorFolder.add(cursor, "speed").min(0).max(1).step(0.01);

  /**
   * animate
   * every frame, we render the scene
   */
  const clock = new THREE.Clock();
  const animate = () => {
    if (isAnimating) {

      const deltaTime = clock.getDelta(); //端末の性能によって動きが変わらないようにする

      //update renderer
      renderer.render(scene, camera);

      //update objects
      for (const mesh of meshes) {
        mesh.rotation.x += 0.1 * deltaTime;
        mesh.rotation.y += 0.1 * deltaTime;

      }
      //camera control
      camera.position.x += cursor.x * deltaTime * cursor.speed;
      camera.position.y += -cursor.y * deltaTime * cursor.speed;

      // Update the animation mixer on each frame
      if (mixer) {
        mixer.update(deltaTime);
      }
      window.requestAnimationFrame(animate);
    }
  };

  animate();

}


window.addEventListener("load", init);
