import bpy
from mathutils import Vector
OUT = "/agent/knufforia/assets/models"

def render_glb(glb, png):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb)
    # Prefer body mesh only (ignore empties / helpers)
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH" and "Body" in o.name]
    if not meshes:
        meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    coords = []
    for o in meshes:
        mw = o.matrix_world
        for c in o.bound_box:
            coords.append(mw @ Vector(c))
    minv = Vector((min(v.x for v in coords), min(v.y for v in coords), min(v.z for v in coords)))
    maxv = Vector((max(v.x for v in coords), max(v.y for v in coords), max(v.z for v in coords)))
    center = (minv + maxv) * 0.5
    height = max(maxv.z - minv.z, 0.1)
    print("bbox", minv, maxv, "h", height)

    bpy.ops.object.light_add(type="AREA", location=(center.x + 1.0, center.y - 1.2, center.z + height * 0.4))
    bpy.context.active_object.data.energy = 150
    bpy.context.active_object.data.size = 2.5
    bpy.ops.object.light_add(type="SUN", rotation=(0.4, 0.2, 0.1))
    bpy.context.active_object.data.energy = 3

    cam_loc = Vector((center.x, center.y - height * 1.7, center.z))
    bpy.ops.object.camera_add(location=cam_loc)
    cam = bpy.context.active_object
    direction = center - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    cam.data.lens = 55
    cam.data.clip_start = 0.01
    cam.data.clip_end = 100

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 512
    scene.render.resolution_y = 768
    scene.render.film_transparent = True
    scene.world = bpy.data.worlds.new("W")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.75, 0.82, 0.88, 1)
    bg.inputs[1].default_value = 0.6
    scene.render.filepath = png
    scene.render.image_settings.file_format = "PNG"
    # Pose armature to rest / frame 1 idle
    for o in bpy.context.scene.objects:
        if o.type == "ARMATURE" and o.animation_data and o.animation_data.action:
            bpy.context.scene.frame_set(1)
    bpy.ops.render.render(write_still=True)
    print("rendered", png)

render_glb(f"{OUT}/base-female.glb", f"{OUT}/preview-female.png")
render_glb(f"{OUT}/base-male.glb", f"{OUT}/preview-male.png")
