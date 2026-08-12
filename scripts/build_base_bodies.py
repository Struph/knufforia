"""
MakeHuman CC0 bases → Fiesta-lean proportions + arms-down natural stand.
Armature only for arms (legs untouched) to avoid mesh tears.
"""
import bpy
import bmesh
import gzip
import math
import os
from mathutils import Vector, Euler

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
    scaled = [(verts[i][0] * 0.1, -verts[i][2] * 0.1, verts[i][1] * 0.1) for i in USED]
    mesh = bpy.data.meshes.new("BodyMesh")
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


def metrics(obj):
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    return min(xs), max(xs), min(ys), max(ys), min(zs), max(zs)


def stylize_fiesta(obj, gender):
    mesh = obj.data
    xmin, xmax, ymin, ymax, zmin, zmax = metrics(obj)
    h = zmax - zmin
    hip_z = zmin + h * 0.52

    for v in mesh.vertices:
        if v.co.z < hip_z:
            v.co.z = hip_z - (hip_z - v.co.z) * 1.08
            t = (hip_z - v.co.z) / max(hip_z - zmin, 1e-6)
            slim = 0.95 + 0.05 * max(0, 1 - t)
            v.co.x *= slim
            v.co.y *= slim

    xmin, xmax, ymin, ymax, zmin, zmax = metrics(obj)
    h = zmax - zmin

    for v in mesh.vertices:
        t = (v.co.z - zmin) / h
        if 0.55 < t < 0.68:
            v.co.x *= 0.91 if gender == "female" else 0.94
            v.co.y *= 0.93 if gender == "female" else 0.95
        if gender == "female" and 0.48 < t < 0.55:
            v.co.x *= 1.03
        if gender == "male" and 0.70 < t < 0.78 and abs(v.co.x) < 0.20:
            v.co.x *= 1.04

    head_cut = zmin + h * 0.79
    hv = [v for v in mesh.vertices if v.co.z >= head_cut]
    if hv:
        c = Vector(
            (
                sum(v.co.x for v in hv) / len(hv),
                sum(v.co.y for v in hv) / len(hv),
                sum(v.co.z for v in hv) / len(hv),
            )
        )
        for v in hv:
            v.co = c + (v.co - c) * 1.10

    mesh.update()


def paint_underwear(obj, gender):
    skin = make_mat(
        "Skin",
        (0.93, 0.76, 0.64, 1.0) if gender == "female" else (0.88, 0.70, 0.56, 1.0),
        0.38,
    )
    cloth = make_mat(
        "Underwear",
        (0.14, 0.16, 0.22, 1.0) if gender == "male" else (0.18, 0.12, 0.18, 1.0),
        0.7,
    )
    mesh = obj.data
    mesh.materials.clear()
    mesh.materials.append(skin)
    mesh.materials.append(cloth)

    xmin, xmax, ymin, ymax, zmin, zmax = metrics(obj)
    h = zmax - zmin
    torso_x = (xmax - xmin) * 0.17

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
        lo, hi = (0.468, 0.525) if gender == "female" else (0.450, 0.535)
        if lo <= t <= hi:
            f.material_index = 1
        # bra only on upper chest band (not midriff)
        if gender == "female" and 0.655 <= t <= 0.705:
            f.material_index = 1
    bmesh.update_edit_mesh(mesh)
    bpy.ops.object.mode_set(mode="OBJECT")


def center_ground(obj):
    coords = [obj.matrix_world @ Vector(c) for c in obj.bound_box]
    min_z = min(v.z for v in coords)
    cx = sum(v.x for v in coords) / len(coords)
    cy = sum(v.y for v in coords) / len(coords)
    obj.location -= Vector((cx, cy, min_z))
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)


def avg(pts):
    return Vector(
        (sum(p.x for p in pts) / len(pts), sum(p.y for p in pts) / len(pts), sum(p.z for p in pts) / len(pts))
    )


def pose_arms_only(obj):
    """Armature with ONLY arm bones — legs stay clean."""
    xmin, xmax, ymin, ymax, zmin, zmax = metrics(obj)
    h = zmax - zmin
    w = xmax - xmin

    def cluster(z0, z1, xsign, xa, xb):
        pts = [
            v.co.copy()
            for v in obj.data.vertices
            if z0 <= v.co.z <= z1 and xa < (v.co.x * xsign) < xb
        ]
        return avg(pts) if pts else None

    chest = Vector((0, 0.02, zmin + h * 0.72))
    l_sh = cluster(zmin + h * 0.74, zmin + h * 0.78, -1, w * 0.10, w * 0.30) or Vector((-w * 0.18, 0, zmin + h * 0.76))
    r_sh = cluster(zmin + h * 0.74, zmin + h * 0.78, 1, w * 0.10, w * 0.30) or Vector((w * 0.18, 0, zmin + h * 0.76))
    l_el = cluster(zmin + h * 0.58, zmin + h * 0.64, -1, w * 0.18, w * 0.45) or Vector((-w * 0.32, 0, zmin + h * 0.60))
    r_el = cluster(zmin + h * 0.58, zmin + h * 0.64, 1, w * 0.18, w * 0.45) or Vector((w * 0.32, 0, zmin + h * 0.60))
    l_wr = cluster(zmin + h * 0.44, zmin + h * 0.52, -1, w * 0.22, w * 0.55) or Vector((-w * 0.40, 0, zmin + h * 0.48))
    r_wr = cluster(zmin + h * 0.44, zmin + h * 0.52, 1, w * 0.22, w * 0.55) or Vector((w * 0.40, 0, zmin + h * 0.48))

    arm_data = bpy.data.armatures.new("ArmOnly")
    arm = bpy.data.objects.new("ArmOnly", arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_data.edit_bones

    def add(name, head, tip, parent=None):
        b = eb.new(name)
        b.head = Vector(head)
        b.tail = Vector(tip)
        if parent:
            b.parent = eb[parent]
            b.use_connect = False
        return b

    # Root anchor (no deformation if weights cleaned)
    add("Root", (0, 0, zmin + h * 0.5), (0, 0, zmin + h * 0.55))
    add("UpperArm.L", l_sh, l_el, "Root")
    add("ForeArm.L", l_el, l_wr, "UpperArm.L")
    add("UpperArm.R", r_sh, r_el, "Root")
    add("ForeArm.R", r_el, r_wr, "UpperArm.R")
    bpy.ops.object.mode_set(mode="OBJECT")

    # Bind
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    # Clear Root weights so only arms move
    vg_names = [g.name for g in obj.vertex_groups]
    if "Root" in vg_names:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.object.vertex_group_set_active(group="Root")
        bpy.ops.object.vertex_group_remove_from()
        bpy.ops.object.mode_set(mode="OBJECT")

    # Pose arms down (from A-pose)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    for name, euler in {
        "UpperArm.L": (10, 0, 58),
        "UpperArm.R": (10, 0, -58),
        "ForeArm.L": (8, 0, 12),
        "ForeArm.R": (8, 0, -12),
    }.items():
        b = arm.pose.bones.get(name)
        if not b:
            continue
        b.rotation_mode = "XYZ"
        b.rotation_euler = Euler(tuple(math.radians(a) for a in euler), "XYZ")
    bpy.ops.object.mode_set(mode="OBJECT")

    # Apply armature
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    for m in list(obj.modifiers):
        if m.type == "ARMATURE":
            bpy.ops.object.modifier_apply(modifier=m.name)

    # Cleanup
    bpy.data.objects.remove(arm, do_unlink=True)
    obj.parent = None
    obj.vertex_groups.clear()

    # Foot stance: small forward offset (no bones)
    for v in obj.data.vertices:
        if v.co.z < zmin + h * 0.08:
            if v.co.x > 0.03:
                v.co.y -= 0.045
            elif v.co.x < -0.03:
                v.co.y += 0.02
    obj.data.update()


def build(gender, target, out_name):
    clear_scene()
    body = import_body_only()
    apply_morph(body, target)
    stylize_fiesta(body, gender)
    paint_underwear(body, gender)
    center_ground(body)

    # Soft "not T-pose": lower arms via constrained shape (safe deltas)
    soften_a_pose(body)

    center_ground(body)

    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    body.name = f"Base_{gender}"

    path = os.path.join(OUT_DIR, out_name)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
    )
    print("WROTE", path, "h", metrics(body)[5] - metrics(body)[4])


def soften_a_pose(obj):
    """Gently pull A-pose hands downward without full IK (preserves mesh)."""
    mesh = obj.data
    xmin, xmax, ymin, ymax, zmin, zmax = metrics(obj)
    h = zmax - zmin
    w = xmax - xmin
    for v in mesh.vertices:
        # only far lateral arm verts
        ax = abs(v.co.x)
        if ax < w * 0.16:
            continue
        if v.co.z < zmin + h * 0.42 or v.co.z > zmin + h * 0.80:
            continue
        # how "hand-like" (further out & lower gets more pull)
        lateral = min(1.0, (ax - w * 0.16) / (w * 0.25))
        # pull toward body side and slightly down
        pull = 0.55 * lateral
        v.co.z -= h * 0.06 * pull
        v.co.x *= 1.0 - 0.28 * pull
    # slight foot stagger
    for v in mesh.vertices:
        if v.co.z < zmin + h * 0.07:
            if v.co.x > 0.03:
                v.co.y -= 0.04
            elif v.co.x < -0.03:
                v.co.y += 0.02
    mesh.update()


build("female", FEMALE_TARGET, "base-female.glb")
build("male", MALE_TARGET, "base-male.glb")
print("DONE")
