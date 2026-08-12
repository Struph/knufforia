window.KnufforiaViewer3D = (() => {
  let THREE, GLTFLoader;
  let renderer, scene, camera, root, currentGender = "female", animId = 0;
  let loading = null;
  let mixer = null;
  let clock = null;
  let baseYaw = 0.35;
  let skeleton = null;
  let dragging = false;

  async function loadThree() {
    if (THREE) return;
    if (loading) return loading;
    loading = (async () => {
      THREE = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
      const mod = await import("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js");
      GLTFLoader = mod.GLTFLoader;
    })();
    return loading;
  }

  async function mount(container) {
    await loadThree();
    if (renderer) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xb8d4ce);
    clock = new THREE.Clock();

    const w = Math.max(container.clientWidth || 280, 120);
    const h = Math.max(container.clientHeight || 360, 160);
    camera = new THREE.PerspectiveCamera(32, w / h, 0.05, 50);
    camera.position.set(0, 1.0, 3.2);
    camera.lookAt(0, 0.9, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff2e8, 0x6a8a88, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(2.2, 3.5, 2.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xb0d0ff, 0.45);
    fill.position.set(-2.5, 1.5, -1.5);
    scene.add(fill);

    root = new THREE.Group();
    scene.add(root);

    let lastX = 0;
    const el = renderer.domElement;
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", (e) => {
      dragging = true;
      lastX = e.clientX;
      el.setPointerCapture?.(e.pointerId);
    });
    el.addEventListener("pointerup", () => {
      dragging = false;
    });
    el.addEventListener("pointermove", (e) => {
      if (!dragging || !root) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      baseYaw += dx * 0.01;
    });

    const tick = () => {
      animId = requestAnimationFrame(tick);
      if (!renderer) return;
      const dt = clock ? clock.getDelta() : 0.016;
      if (mixer) mixer.update(dt);
      if (root) {
        const sway = dragging ? 0 : Math.sin(performance.now() * 0.0007) * 0.06;
        root.rotation.y = baseYaw + sway;
      }
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw > 0 && ch > 0) {
        const pr = renderer.getPixelRatio();
        if (
          renderer.domElement.width !== Math.floor(cw * pr) ||
          renderer.domElement.height !== Math.floor(ch * pr)
        ) {
          renderer.setSize(cw, ch, false);
          camera.aspect = cw / ch;
          camera.updateProjectionMatrix();
        }
      }
      renderer.render(scene, camera);
    };
    tick();
  }

  async function show(gender) {
    await loadThree();
    currentGender = gender === "male" ? "male" : "female";
    if (!root) return;

    if (mixer) {
      mixer.stopAllAction();
      mixer = null;
    }
    skeleton = null;

    while (root.children.length) {
      const c = root.children[0];
      root.remove(c);
      c.traverse?.((o) => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
          else o.material.dispose?.();
        }
      });
    }

    const loader = new GLTFLoader();
    const url = `assets/models/base-${currentGender}.glb`;
    await new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          model.traverse((o) => {
            if (o.isSkinnedMesh && o.skeleton) skeleton = o.skeleton;
            if (o.isMesh) {
              o.frustumCulled = false;
            }
          });

          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          model.position.y += size.y * 0.5;
          const scale = 1.7 / Math.max(size.y, 0.001);
          model.scale.setScalar(scale);
          root.add(model);
          baseYaw = 0.35;
          root.rotation.y = baseYaw;
          camera.position.set(0, 0.95, 3.35);
          camera.lookAt(0, 0.85, 0);

          if (gltf.animations && gltf.animations.length) {
            mixer = new THREE.AnimationMixer(model);
            const clip = gltf.animations.find((a) => /idle/i.test(a.name)) || gltf.animations[0];
            const action = mixer.clipAction(clip);
            action.play();
          }
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  function getBoneNames() {
    if (!skeleton) return [];
    return skeleton.bones.map((b) => b.name);
  }

  function dispose() {
    cancelAnimationFrame(animId);
    mixer?.stopAllAction();
    mixer = null;
    renderer?.dispose?.();
    renderer = null;
  }

  return {
    mount,
    show,
    dispose,
    getBoneNames,
    get skeleton() {
      return skeleton;
    },
    get gender() {
      return currentGender;
    },
  };
})();
