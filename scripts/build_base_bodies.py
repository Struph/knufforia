"""MakeHuman CC0 bases with underwear as material regions on the body (clean)."""
import bpy, bmesh, gzip, os
from mathutils import Vector

OUT_DIR = "/agent/knufforia/assets/models"
OBJ_PATH = "/tmp/mh-base.obj"
MALE_TARGET = "/tmp/mh/male.target.gz"
FEMALE_TARGET = "/tmp/mh/female.target.gz"
os.makedirs(OUT_DIR, exist_ok=True)
USED = []


def clear_scene():
    bpy.ops.wm.read_homefile(use_empty=True)


def load_target(path):
    data = {}
    with gzip.open(path, "rt", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            p = line.split()
            if len(p) >= 4:
                data[int(float(p[0]))] = (float(p[1]), float(p[2]), float(p[3]))
    return data


def make_mat(name, color, rough=0.5):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = color
    bsdf.inputs["Roughness"].default_value = rough
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def import_body_only():
    global USED
    verts, body_faces, group = [], [], None
    with open(OBJ_PATH, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if line.startswith("v "):
                _, x, y, z = line.split()[:4]
                verts.append((float(x), float(y), float(z)))
            elif line.startswith("g "):
                group = line.split()[1].strip()
            elif line.startswith("f ") and group == "body":
                idxs = [int(p.split("/")[0]) - 1 for p in line.split()[1:]]
                if len(idxs) >= 3:
                    body_faces.append(idxs)
    USED = sorted({i for face in body_faces for i in face})
    remap = {old: new for new, old in enumerate(USED)}
    mesh = bpy.data.meshes.new("BodyMesh")
    # MakeHuman OBJ is Y-up (decimeters). Convert to Blender Z-up meters:
    # (x, y, z)_MH -> (x, -z, y)_Blender * 0.1
    scaled = [(verts[i][0] * 0.1, -verts[i][2] * 0.1, verts[i][1] * 0.1) for i in USED]
    mesh.from_pydata(scaled, [], [tuple(remap[i] for i in face) for face in body_faces])
    mesh.update()
    obj = bpy.data.objects.new("BaseBody", mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.shade_smooth()
    return obj


def apply_morph(obj, path):
    morph = load_target(path)
    mesh = obj.data
    for new_i, old_i in enumerate(USED):
        if old_i in morph:
            dx, dy, dz = morph[old_i]
            mesh.vertices[new_i].co += Vector((dx * 0.1, -dz * 0.1, dy * 0.1))
    mesh.update()


def stylize(obj, gender):
    mesh = obj.data
    zs = [v.co.z for v in mesh.vertices]
    zmin, zmax = min(zs), max(zs)
    h = zmax - zmin
    head_cut = zmin + h * 0.80
    hv = [v for v in mesh.vertices if v.co.z >= head_cut]
    if hv:
        c = Vector((sum(v.co.x for v in hv)/len(hv), sum(v.co.y for v in hv)/len(hv), sum(v.co.z for v in hv)/len(hv)))
        for v in hv:
            v.co = c + (v.co - c) * 1.08
    for v in mesh.vertices:
        t = (v.co.z - zmin) / h
        if 0.55 < t < 0.68:
            v.co.x *= 0.94 if gender == "female" else 0.96
            v.co.y *= 0.96
        if gender == "female" and 0.46 < t < 0.56:
            v.co.x *= 1.04
        if gender == "male" and 0.62 < t < 0.74:
            v.co.x *= 1.03
    mesh.update()


def paint_underwear(obj, gender):
    skin = make_mat("Skin", (0.92, 0.74, 0.62, 1.0) if gender == "female" else (0.86, 0.68, 0.54, 1.0), 0.4)
    cloth = make_mat(
        "Underwear",
        (0.18, 0.22, 0.34, 1.0) if gender == "male" else (0.22, 0.16, 0.28, 1.0),
        0.72,
    )
    mesh = obj.data
    mesh.materials.clear()
    mesh.materials.append(skin)
    mesh.materials.append(cloth)

    zs = [v.co.z for v in mesh.vertices]
    xs = [v.co.x for v in mesh.vertices]
    zmin, zmax = min(zs), max(zs)
    h = zmax - zmin
    torso_x = (max(xs) - min(xs)) * 0.20

    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bm = bmesh.from_edit_mesh(mesh)
    bm.faces.ensure_lookup_table()
    for f in bm.faces:
        f.material_index = 0
        cx = sum(v.co.x for v in f.verts) / len(f.verts)
        cz = sum(v.co.z for v in f.verts) / len(f.verts)
        t = (cz - zmin) / h
        if abs(cx) > torso_x:
            continue
        # boxers / slip
        lo, hi = (0.465, 0.545) if gender == "female" else (0.455, 0.555)
        if lo <= t <= hi:
            f.material_index = 1
        # bra
        if gender == "female" and 0.635 <= t <= 0.72:
            f.material_index = 1
    bmesh.update_edit_mesh(mesh)
    bpy.ops.object.mode_set(mode="OBJECT")


def center_ground(obj):
    coords = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    min_z = min(v.z for v in coords)
    cx = sum(v.x for v in coords) / len(coords)
    cy = sum(v.y for v in coords) / len(coords)
    obj.location.x -= cx
    obj.location.y -= cy
    obj.location.z -= min_z
    bpy.context.view_layer.update()
    # Apply location so GLB origin is at feet
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)


def build(gender, target, out_name):
    clear_scene()
    body = import_body_only()
    apply_morph(body, target)
    stylize(body, gender)
    paint_underwear(body, gender)
    center_ground(body)
    body.name = f"Base_{gender}"
    path = os.path.join(OUT_DIR, out_name)
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print("WROTE", path, "verts", len(body.data.vertices))


build("female", FEMALE_TARGET, "base-female.glb")
build("male", MALE_TARGET, "base-male.glb")
print("DONE")
