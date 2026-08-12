import bpy
from mathutils import Vector
OUT = "/agent/knufforia/assets/models"

def render_glb(glb, png):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=glb)
    # Drop stray default/helper meshes with no materials
    for o in list(bpy.context.scene.objects):
        if o.type == "MESH" and (not o.data.materials or o.name.startswith("Icosphere")):
            bpy.data.objects.remove(o, do_unlink=True)
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

    bpy.ops.object.light_add(type="AREA", location=(center.x + 0.8, center.y - 1.0, center.z + height * 0.35))
    bpy.context.active_object.data.energy = 25
    bpy.context.active_object.data.size = 2.0
    bpy.ops.object.light_add(type="AREA", location=(center.x - 0.6, center.y + 0.8, center.z + height * 0.5))
    bpy.context.active_object.data.energy = 12
    bpy.context.active_object.data.size = 1.5
    bpy.ops.object.light_add(type="SUN", rotation=(0.5, 0.15, 0.2))
    bpy.context.active_object.data.energy = 0.8

    cam_loc = Vector((center.x, center.y - height * 1.85, center.z + height * 0.02))
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
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = -0.3
    scene.render.resolution_x = 512
    scene.render.resolution_y = 768
    scene.render.film_transparent = True
    scene.world = bpy.data.worlds.new("W")
    scene.world.use_nodes = True
    bg = scene.world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.55, 0.60, 0.68, 1)
    bg.inputs[1].default_value = 0.35
    scene.render.filepath = png
    scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.frame_set(1)
    bpy.ops.render.render(write_still=True)
    print("rendered", png)

render_glb(f"{OUT}/base-female.glb", f"{OUT}/preview-female.png")
render_glb(f"{OUT}/base-male.glb", f"{OUT}/preview-male.png")
