window.KnufforiaViewer3D = (() => {
  let THREE, GLTFLoader;
  let renderer, scene, camera, root, currentGender = "female", animId = 0;
  let loading = null;

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

    let dragging = false;
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
      root.rotation.y += dx * 0.01;
    });

    const tick = () => {
      animId = requestAnimationFrame(tick);
      if (!renderer) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      if (cw > 0 && ch > 0) {
        const bw = renderer.domElement.width;
        const bh = renderer.domElement.height;
        if (bw !== Math.floor(cw * renderer.getPixelRatio()) || bh !== Math.floor(ch * renderer.getPixelRatio())) {
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
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center);
          model.position.y += size.y * 0.5;
          const scale = 1.7 / Math.max(size.y, 0.001);
          model.scale.setScalar(scale);
          root.add(model);
          root.rotation.y = 0.35;
          camera.position.set(0, 0.95, 3.35);
          camera.lookAt(0, 0.85, 0);
          resolve();
        },
        undefined,
        reject
      );
    });
  }

  function dispose() {
    cancelAnimationFrame(animId);
    renderer?.dispose?.();
    renderer = null;
  }

  return {
    mount,
    show,
    dispose,
    get gender() {
      return currentGender;
    },
  };
})();
