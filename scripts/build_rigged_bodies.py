"""
Build Fiesta-lean MakeHuman bases with a full humanoid skeleton rig.
Exports skinned GLB (mesh + armature) + natural standing rest pose.
"""
import bpy
import bmesh
import gzip
import math
import os
from mathutils import Vector, Euler, Matrix

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
    obj = bpy.data.objects.new("Body", mesh)
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
        if gender == "female" and 0.655 <= t <= 0.705:
            f.material_index = 1
    bmesh.update_edit_mesh(mesh)
    bpy.ops.object.mode_set(mode="OBJECT")


def center_ground(obj):
    deps = bpy.context.evaluated_depsgraph_get()
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


def avg(pts, fallback):
    if not pts:
        return Vector(fallback)
    return Vector(
        (
            sum(p.x for p in pts) / len(pts),
            sum(p.y for p in pts) / len(pts),
            sum(p.z for p in pts) / len(pts),
        )
    )


def joint_point(obj, z0, z1, xsign=None, xmin=0.0, xmax=9.0):
    pts = []
    for v in obj.data.vertices:
        if not (z0 <= v.co.z <= z1):
            continue
        ax = abs(v.co.x) if xsign is None else (v.co.x * xsign)
        if xmin <= ax <= xmax:
            pts.append(v.co.copy())
    return pts


def create_humanoid_armature(obj, name="Armature"):
    """Build a standard humanoid rig aligned to the A-pose mesh."""
    xmin, xmax, ymin, ymax, zmin, zmax = metrics(obj)
    h = zmax - zmin
    w = xmax - xmin

    def z(t):
        return zmin + h * t

    hips = Vector((0, 0.01, z(0.515)))
    spine = Vector((0, 0.02, z(0.60)))
    chest = Vector((0, 0.03, z(0.70)))
    neck = Vector((0, 0.02, z(0.80)))
    head = Vector((0, 0.03, z(0.93)))
    head_tip = Vector((0, 0.03, z(0.99)))

    l_sh = avg(joint_point(obj, z(0.74), z(0.78), -1, w * 0.10, w * 0.28), (-w * 0.18, 0.02, z(0.76)))
    r_sh = avg(joint_point(obj, z(0.74), z(0.78), 1, w * 0.10, w * 0.28), (w * 0.18, 0.02, z(0.76)))
    l_el = avg(joint_point(obj, z(0.58), z(0.64), -1, w * 0.20, w * 0.48), (-w * 0.32, 0.01, z(0.61)))
    r_el = avg(joint_point(obj, z(0.58), z(0.64), 1, w * 0.20, w * 0.48), (w * 0.32, 0.01, z(0.61)))
    l_wr = avg(joint_point(obj, z(0.45), z(0.52), -1, w * 0.24, w * 0.55), (-w * 0.40, 0.0, z(0.48)))
    r_wr = avg(joint_point(obj, z(0.45), z(0.52), 1, w * 0.24, w * 0.55), (w * 0.40, 0.0, z(0.48)))
    l_hand = l_wr + Vector((-0.04, 0, -0.02))
    r_hand = r_wr + Vector((0.04, 0, -0.02))

    l_up = avg(joint_point(obj, z(0.46), z(0.52), -1, w * 0.04, w * 0.18), (-w * 0.08, 0.01, z(0.49)))
    r_up = avg(joint_point(obj, z(0.46), z(0.52), 1, w * 0.04, w * 0.18), (w * 0.08, 0.01, z(0.49)))
    l_kn = avg(joint_point(obj, z(0.25), z(0.31), -1, w * 0.03, w * 0.16), (-w * 0.07, 0.01, z(0.28)))
    r_kn = avg(joint_point(obj, z(0.25), z(0.31), 1, w * 0.03, w * 0.16), (w * 0.07, 0.01, z(0.28)))
    l_an = avg(joint_point(obj, z(0.03), z(0.09), -1, w * 0.02, w * 0.16), (-w * 0.06, 0.04, z(0.05)))
    r_an = avg(joint_point(obj, z(0.03), z(0.09), 1, w * 0.02, w * 0.16), (w * 0.06, 0.04, z(0.05)))
    l_toe = l_an + Vector((0, -0.06, 0))
    r_toe = r_an + Vector((0, -0.06, 0))

    arm_data = bpy.data.armatures.new(f"{name}Data")
    arm_data.display_type = "OCTAHEDRAL"
    arm = bpy.data.objects.new(name, arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    eb = arm_data.edit_bones

    def bone(n, head, tip, parent=None, connect=False):
        b = eb.new(n)
        b.head = Vector(head)
        b.tail = Vector(tip)
        if (b.tail - b.head).length < 0.01:
            b.tail = b.head + Vector((0, 0, 0.05))
        if parent:
            b.parent = eb[parent]
            b.use_connect = connect
        return b

    # Mixamo-ish names for easier tooling later
    bone("Hips", hips + Vector((0, 0, -0.05)), hips)
    bone("Spine", hips, spine, "Hips")
    bone("Spine1", spine, chest, "Spine", True)
    bone("Spine2", chest, neck, "Spine1", True)
    bone("Neck", neck, head, "Spine2", True)
    bone("Head", head, head_tip, "Neck", True)

    bone("LeftShoulder", chest + Vector((-0.02, 0, 0.02)), l_sh, "Spine2")
    bone("LeftArm", l_sh, l_el, "LeftShoulder", True)
    bone("LeftForeArm", l_el, l_wr, "LeftArm", True)
    bone("LeftHand", l_wr, l_hand, "LeftForeArm", True)

    bone("RightShoulder", chest + Vector((0.02, 0, 0.02)), r_sh, "Spine2")
    bone("RightArm", r_sh, r_el, "RightShoulder", True)
    bone("RightForeArm", r_el, r_wr, "RightArm", True)
    bone("RightHand", r_wr, r_hand, "RightForeArm", True)

    bone("LeftUpLeg", hips, l_kn, "Hips")
    # Better: hips -> upper thigh point first
    eb["LeftUpLeg"].tail = l_kn
    bone("LeftLeg", l_kn, l_an, "LeftUpLeg", True)
    bone("LeftFoot", l_an, l_toe, "LeftLeg", True)

    bone("RightUpLeg", hips, r_kn, "Hips")
    eb["RightUpLeg"].tail = r_kn
    bone("RightLeg", r_kn, r_an, "RightUpLeg", True)
    bone("RightFoot", r_an, r_toe, "RightLeg", True)

    # Align bone rolls roughly
    bpy.ops.armature.select_all(action="SELECT")
    bpy.ops.armature.calculate_roll(type="GLOBAL_POS_Y")
    bpy.ops.object.mode_set(mode="OBJECT")
    return arm


def bind_weights(obj, arm):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")

    # Limit extreme weights: normalize
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
    bpy.ops.object.vertex_group_normalize_all(lock_active=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def set_natural_pose(arm):
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm.pose.bones

    def rot(name, rx=0, ry=0, rz=0):
        b = pb.get(name)
        if not b:
            return
        b.rotation_mode = "XYZ"
        b.rotation_euler = Euler((math.radians(rx), math.radians(ry), math.radians(rz)), "XYZ")

    # Arms: A-pose (~45°) → relaxed at sides (~15°)
    rot("LeftShoulder", rz=-4)
    rot("RightShoulder", rz=4)
    rot("LeftArm", rx=6, rz=-34)
    rot("RightArm", rx=6, rz=34)
    rot("LeftForeArm", rx=12, rz=-8)
    rot("RightForeArm", rx=12, rz=8)
    rot("LeftHand", rx=-6)
    rot("RightHand", rx=-6)

    # Slight stride / weight
    rot("Hips", ry=-3, rz=2)
    rot("Spine", rx=3)
    rot("Spine1", rx=-2, ry=2)
    rot("Spine2", ry=2)
    rot("Neck", rx=-4)
    rot("Head", ry=-4, rx=-2)

    rot("RightUpLeg", rx=-12, rz=-2)
    rot("RightLeg", rx=10)
    rot("RightFoot", rx=4)
    rot("LeftUpLeg", rx=7, rz=3)
    rot("LeftLeg", rx=6)
    rot("LeftFoot", rx=2)

    bpy.ops.object.mode_set(mode="OBJECT")


def apply_pose_as_rest(arm, obj):
    """Bake posed deformation into mesh, then make that the new rest pose."""
    # 1) Bake armature deformation into mesh WHILE pose is active
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    for m in list(obj.modifiers):
        if m.type == "ARMATURE":
            bpy.ops.object.modifier_apply(modifier=m.name)

    # Keep world transform, clear parenting
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # 2) Apply pose as new bone rest (pose → rest, clears pose channels)
    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    # 3) Re-bind automatic weights to the new rest pose
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
    try:
        bpy.ops.object.vertex_group_limit_total(limit=4)
    except Exception:
        pass
    bpy.ops.object.vertex_group_normalize_all(lock_active=False)
    bpy.ops.object.mode_set(mode="OBJECT")


def add_idle_animation(arm):
    """Tiny breathing / sway clip stored in the GLB."""
    if not arm.animation_data:
        arm.animation_data_create()
    action = bpy.data.actions.new(name="Idle")
    arm.animation_data.action = action
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    pb = arm.pose.bones
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 60

    def key(name, frame, rx, ry, rz):
        b = pb.get(name)
        if not b:
            return
        b.rotation_mode = "XYZ"
        b.rotation_euler = Euler((math.radians(rx), math.radians(ry), math.radians(rz)), "XYZ")
        b.keyframe_insert(data_path="rotation_euler", frame=frame)

    # Subtle chest breath + weight shift
    key("Spine1", 1, 0, 0, 0)
    key("Spine1", 30, 2, 0, 0)
    key("Spine1", 60, 0, 0, 0)
    key("Hips", 1, 0, 0, 0)
    key("Hips", 30, 0, 1.5, 0)
    key("Hips", 60, 0, 0, 0)
    key("Head", 1, 0, 0, 0)
    key("Head", 30, -1, 2, 0)
    key("Head", 60, 0, 0, 0)
    bpy.ops.object.mode_set(mode="OBJECT")
    return action


def export_rigged(path, arm, obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_animations=True,
        export_skins=True,
        export_yup=True,
        export_morph=False,
    )


def build(gender, target, out_name):
    clear_scene()
    body = import_body_only()
    apply_morph(body, target)
    stylize_fiesta(body, gender)
    paint_underwear(body, gender)
    center_ground(body)

    arm = create_humanoid_armature(body, name=f"Armature_{gender}")
    bind_weights(body, arm)
    set_natural_pose(arm)
    apply_pose_as_rest(arm, body)
    center_ground(body)
    # keep armature at origin with body
    arm.location = (0, 0, 0)
    add_idle_animation(arm)

    body.name = f"Body_{gender}"
    arm.name = f"Armature_{gender}"

    path = os.path.join(OUT_DIR, out_name)
    export_rigged(path, arm, body)
    print("WROTE", path, "bones", len(arm.data.bones), "verts", len(body.data.vertices))


build("female", FEMALE_TARGET, "base-female.glb")
build("male", MALE_TARGET, "base-male.glb")
print("DONE")
