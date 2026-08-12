#!/usr/bin/env python3
"""
Fiesta-style hero bases: body-only MakeHuman mesh + humanoid rig + warm skin
+ dark-violet shoulder-cut hair (female) / short brown (male) + simple face.
"""
from __future__ import annotations

import gzip
import math
import os
from pathlib import Path

import bmesh
import bpy
from mathutils import Euler, Vector

OUT_DIR = Path("/agent/knufforia/assets/models")
OBJ_PATH = Path("/tmp/mh-base.obj")
MALE_TARGET = Path("/tmp/mh/male.target.gz")
FEMALE_TARGET = Path("/tmp/mh/female.target.gz")
OUT_DIR.mkdir(parents=True, exist_ok=True)
USED: list[int] = []


def clear_scene():
    bpy.ops.wm.read_homefile(use_empty=True)


def load_target(path: Path):
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
    """Import only the MakeHuman `body` group — skip helpers/joints (those cause fins)."""
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
    # MakeHuman Y-up → Blender Z-up, face toward -Y
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


def apply_morph(obj, path: Path):
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
    # Warm fair skin (not mannequin white)
    skin = make_mat(
        "Skin",
        (0.78, 0.55, 0.42, 1.0) if gender == "female" else (0.74, 0.52, 0.40, 1.0),
        0.52,
    )
    cloth = make_mat(
        "Underwear",
        (0.14, 0.16, 0.22, 1.0) if gender == "male" else (0.16, 0.12, 0.18, 1.0),
        0.72,
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
    eb["LeftUpLeg"].tail = l_kn
    bone("LeftLeg", l_kn, l_an, "LeftUpLeg", True)
    bone("LeftFoot", l_an, l_toe, "LeftLeg", True)

    bone("RightUpLeg", hips, r_kn, "Hips")
    eb["RightUpLeg"].tail = r_kn
    bone("RightLeg", r_kn, r_an, "RightUpLeg", True)
    bone("RightFoot", r_an, r_toe, "RightLeg", True)

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
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="WEIGHT_PAINT")
    try:
        bpy.ops.object.vertex_group_limit_total(limit=4)
    except Exception:
        pass
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

    rot("LeftShoulder", rz=-4)
    rot("RightShoulder", rz=4)
    rot("LeftArm", rx=6, rz=-34)
    rot("RightArm", rx=6, rz=34)
    rot("LeftForeArm", rx=12, rz=-8)
    rot("RightForeArm", rx=12, rz=8)
    rot("LeftHand", rx=-6)
    rot("RightHand", rx=-6)
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
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    for m in list(obj.modifiers):
        if m.type == "ARMATURE":
            bpy.ops.object.modifier_apply(modifier=m.name)
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.object.select_all(action="DESELECT")
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="POSE")
    bpy.ops.pose.select_all(action="SELECT")
    bpy.ops.pose.armature_apply(selected=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    bind_weights(obj, arm)


def cleanup_arm_fins(obj):
    """Pull obvious weight-spike vertices back toward the torso envelope."""
    me = obj.data
    xmin, xmax, ymin, ymax, zmin, zmax = metrics(obj)
    h = zmax - zmin
    # Shoulder band
    for v in me.vertices:
        t = (v.co.z - zmin) / h
        ax = abs(v.co.x)
        # spikes stick far out around shoulders / upper arms
        if 0.62 < t < 0.82 and ax > 0.20:
            # soft clamp lateral extent
            limit = 0.20 + (0.82 - t) * 0.35
            if ax > limit:
                v.co.x = (limit if v.co.x > 0 else -limit) * 0.98
        if 0.45 < t < 0.62 and ax > 0.28:
            limit = 0.28 + (t - 0.45) * 0.4
            if ax > limit:
                v.co.x = (limit if v.co.x > 0 else -limit) * 0.98
    me.update()


def head_center(obj):
    xmin, xmax, ymin, ymax, zmin, zmax = metrics(obj)
    h = zmax - zmin
    top = zmin + h * 0.86
    pts = [v.co for v in obj.data.vertices if v.co.z >= top]
    if not pts:
        return Vector((0, 0, zmax - 0.08))
    return Vector(
        (
            sum(p.x for p in pts) / len(pts),
            sum(p.y for p in pts) / len(pts),
            sum(p.z for p in pts) / len(pts),
        )
    )


def head_front_y(obj):
    xmin, xmax, ymin, ymax, zmin, zmax = metrics(obj)
    h = zmax - zmin
    top = zmin + h * 0.82
    ys = [v.co.y for v in obj.data.vertices if v.co.z >= top and abs(v.co.x) < 0.08]
    return min(ys) if ys else ymin


def textured_mat(name, image_path, rough=0.45):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.blend_method = "HASHED"
    try:
        mat.shadow_method = "HASHED"
    except Exception:
        pass
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    tex = nt.nodes.new("ShaderNodeTexImage")
    img = bpy.data.images.load(str(image_path))
    img.alpha_mode = "STRAIGHT"
    tex.image = img
    bsdf.inputs["Roughness"].default_value = rough
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    if "Alpha" in bsdf.inputs:
        nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


def make_card(name, mat, width, height, location):
    """XY plane rotated to face -Y (character forward)."""
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=location)
    o = bpy.context.active_object
    o.name = name
    o.scale = (width, height, 1.0)
    o.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.location = location
    bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
    if o.data.materials:
        o.data.materials[0] = mat
    else:
        o.data.materials.append(mat)
    # ensure UVs exist
    if not o.data.uv_layers:
        o.data.uv_layers.new(name="UVMap")
    return o


def make_hair(female: bool, hc: Vector, front_y: float):
    tex_dir = OUT_DIR / "tex"
    if female:
        mat = textured_mat("HairCardMat", tex_dir / "hair-violet-card.png", 0.4)
        # Main silhouette card — Fiesta shoulder cut with face window + braid
        # Sit on the skull; keep face window aligned with eyes
        hair = make_card(
            "HairTemp",
            mat,
            width=0.30,
            height=0.34,
            location=Vector((0.0, front_y - 0.008, hc.z + 0.06)),
        )
        return hair
    # Male: simple brown volume (no violet card)
    hair_mat = make_mat("HairBrown", (0.12, 0.06, 0.035, 1.0), 0.4)
    parts = []
    for loc, sc in [
        (Vector((0, 0.02, 0.04)), (0.095, 0.10, 0.06)),
        (Vector((0, -0.07, 0.03)), (0.07, 0.025, 0.025)),
        (Vector((0.07, 0.01, 0.0)), (0.028, 0.04, 0.055)),
        (Vector((-0.07, 0.01, 0.0)), (0.028, 0.04, 0.055)),
    ]:
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=10, radius=1.0, location=loc)
        o = bpy.context.active_object
        o.scale = sc
        bpy.ops.object.transform_apply(scale=True)
        o.data.materials.append(hair_mat)
        parts.append(o)
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    hair = bpy.context.active_object
    hair.name = "HairTemp"
    # move to head
    ab = bounds_obj(hair)
    offset = hc - ab["center"]
    offset.z += 0.015
    offset.y += 0.01
    hair.location = hair.location + offset
    bpy.ops.object.select_all(action="DESELECT")
    hair.select_set(True)
    bpy.context.view_layer.objects.active = hair
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return hair


def make_face(female: bool, hc: Vector, front_y: float):
    tex_dir = OUT_DIR / "tex"
    if female:
        mat = textured_mat("FaceCardMat", tex_dir / "face-anime-card.png", 0.45)
        # Slightly smaller than hair, sit just in front of hair card
        # Compact face plate at eye level (texture is a full head — keep it small)
        face = make_card(
            "FaceTemp",
            mat,
            width=0.15,
            height=0.17,
            location=Vector((0.0, front_y - 0.03, hc.z + 0.04)),
        )
        return face
    # Male: simple eyes only
    eye_mat = make_mat("EyeWhite", (0.97, 0.97, 0.98, 1), 0.22)
    iris_mat = make_mat("Iris", (0.16, 0.26, 0.42, 1), 0.18)
    objs = []
    fy = front_y - 0.02
    ez = hc.z + 0.005
    for sgn in (1.0, -1.0):
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=12, ring_count=8, radius=0.016, location=Vector((sgn * 0.03, fy, ez))
        )
        eye = bpy.context.active_object
        eye.scale = (1.15, 0.5, 1.3)
        bpy.ops.object.transform_apply(scale=True)
        eye.data.materials.append(eye_mat)
        objs.append(eye)
        bpy.ops.mesh.primitive_uv_sphere_add(
            segments=10, ring_count=8, radius=0.008, location=Vector((sgn * 0.03, fy - 0.008, ez))
        )
        iris = bpy.context.active_object
        iris.scale = (1.0, 0.45, 1.15)
        bpy.ops.object.transform_apply(scale=True)
        iris.data.materials.append(iris_mat)
        objs.append(iris)
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    face = bpy.context.active_object
    face.name = "FaceTemp"
    return face


def bounds_obj(obj):
    pts = [obj.matrix_world @ v.co for v in obj.data.vertices]
    xs, ys, zs = [p.x for p in pts], [p.y for p in pts], [p.z for p in pts]
    return {
        "center": Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2)),
        "min": Vector((min(xs), min(ys), min(zs))),
        "max": Vector((max(xs), max(ys), max(zs))),
    }


def merge_onto_body(body, accessory):
    before = len(body.data.vertices)
    for m in accessory.data.materials:
        if m and m.name not in [x.name for x in body.data.materials if x]:
            body.data.materials.append(m)

    bpy.ops.object.select_all(action="DESELECT")
    accessory.select_set(True)
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()
    body = bpy.context.active_object

    if "Head" not in body.vertex_groups:
        body.vertex_groups.new(name="Head")
    vg = body.vertex_groups["Head"]
    new_idx = list(range(before, len(body.data.vertices)))
    if new_idx:
        for g in body.vertex_groups:
            if g.name != "Head":
                g.remove(new_idx)
        vg.add(new_idx, 1.0, "REPLACE")
    return body


def add_idle_animation(arm):
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
        filepath=str(path),
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_animations=True,
        export_skins=True,
        export_yup=True,
        export_morph=False,
    )


def build(gender: str, target: Path, out_name: str):
    clear_scene()
    female = gender == "female"
    body = import_body_only()
    apply_morph(body, target)
    stylize_fiesta(body, gender)
    paint_underwear(body, gender)
    center_ground(body)

    arm = create_humanoid_armature(body, name=f"Armature_{gender}")
    bind_weights(body, arm)
    set_natural_pose(arm)
    apply_pose_as_rest(arm, body)
    cleanup_arm_fins(body)
    center_ground(body)
    arm.location = (0, 0, 0)

    hc = head_center(body)
    fy = head_front_y(body)
    # Face first (closer to camera), then hair card behind it
    face = make_face(female, hc, fy)
    hair = make_hair(female, hc, fy)
    # Prefer upper part of face texture (eyes/cheeks), crop neck
    if female and face.data.uv_layers:
        uv = face.data.uv_layers.active.data
        for loop in uv:
            # zoom into central face: u 0.18-0.82, v 0.28-0.92
            loop.uv.x = 0.18 + loop.uv.x * 0.64
            loop.uv.y = 0.28 + loop.uv.y * 0.64
    body = merge_onto_body(body, face)
    body = merge_onto_body(body, hair)

    # Keep armature binding after join
    for mod in list(body.modifiers):
        if mod.type == "ARMATURE":
            body.modifiers.remove(mod)
    mod = body.modifiers.new("Armature", "ARMATURE")
    mod.object = arm
    mod.use_vertex_groups = True
    body.parent = arm
    body.parent_type = "OBJECT"

    add_idle_animation(arm)
    body.name = f"Body_{gender}"
    arm.name = f"Armature_{gender}"

    path = OUT_DIR / out_name
    export_rigged(path, arm, body)
    xmin, xmax, ymin, ymax, zmin, zmax = metrics(body)
    print(
        "WROTE",
        path,
        "bones",
        len(arm.data.bones),
        "verts",
        len(body.data.vertices),
        "w",
        round(xmax - xmin, 3),
        "h",
        round(zmax - zmin, 3),
    )


build("female", FEMALE_TARGET, "base-female.glb")
build("male", MALE_TARGET, "base-male.glb")
print("DONE")
