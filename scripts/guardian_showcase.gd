extends Node3D
## Vitrine opcional para cinco GLBs da v0.2. Sem colisoes ou IA.
const Catalog = preload("res://scripts/guardian_asset_catalog.gd")
var characters: Dictionary = {}
var animations: Dictionary = {}

func populate(available: Dictionary) -> void:
	var ids: Array[String] = Catalog.ids()
	for i in range(ids.size()):
		var identifier: String = ids[i]
		if not available.has(identifier):
			continue
		var packed: PackedScene = available[identifier] as PackedScene
		if packed == null:
			continue
		var actor: Node3D = packed.instantiate() as Node3D
		if actor == null:
			push_warning("GLB sem raiz Node3D: " + identifier)
			continue
		var anchor := Node3D.new()
		anchor.name = identifier
		anchor.position = Vector3((float(i) - 2.0) * 5.6, 0.0, 0.0)
		add_child(anchor)
		actor.name = "Visual"
		anchor.add_child(actor)
		actor.rotation.y = PI
		characters[identifier] = actor
		var stage := MeshInstance3D.new()
		stage.name = "Pedestal"
		var disc := CylinderMesh.new()
		disc.top_radius = 1.3
		disc.bottom_radius = 1.3
		disc.height = 0.08
		disc.radial_segments = 20
		stage.mesh = disc
		var stone := StandardMaterial3D.new()
		stone.albedo_color = Color("504a35")
		stone.roughness = 0.9
		stage.material_override = stone
		stage.position.y = -0.06
		anchor.add_child(stage)
		var label := Label3D.new()
		label.name = "Nome"
		label.text = str(Catalog.spec(identifier).get("display_name", identifier))
		label.position = Vector3(0.0, 3.4, 0.0)
		label.font_size = 32
		label.pixel_size = 0.008
		label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		label.modulate = Color("e9c77b")
		anchor.add_child(label)
		var player := _find_animation(actor)
		if player != null:
			animations[identifier] = player
			for clip in player.get_animation_list():
				if "idle" in String(clip).to_lower():
					var anim := player.get_animation(clip)
					if anim != null:
						anim.loop_mode = Animation.LOOP_LINEAR
					player.play(clip)
					break

func _find_animation(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node as AnimationPlayer
	for child in node.get_children():
		var found := _find_animation(child)
		if found != null:
			return found
	return null
