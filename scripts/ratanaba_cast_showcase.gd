extends Node3D
## Opt-in Ratanaba cast gallery. No collisions; keeps the original gameplay intact.
const Cast = preload("res://scripts/ratanaba_cast_catalog.gd")
var characters: Dictionary = {}
var animations: Dictionary = {}
func populate(available: Dictionary) -> void:
	for i in range(Cast.ids().size()):
		var id: String = Cast.ids()[i]
		if not available.has(id):
			continue
		var packed: PackedScene = available[id] as PackedScene
		if packed == null:
			continue
		var actor: Node3D = packed.instantiate() as Node3D
		if actor == null:
			continue
		var anchor := Node3D.new()
		anchor.name = id
		anchor.position = Vector3((i - 2.5) * 4.6, 0, 0)
		add_child(anchor)
		anchor.add_child(actor)
		actor.name = "Visual"
		actor.rotation.y = PI
		characters[id] = actor
		var label := Label3D.new()
		label.name = "Nome"
		label.text = Cast.SPECS[id]["name"]
		label.position = Vector3(0, 3.6, 0)
		label.font_size = 28
		label.pixel_size = 0.007
		label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		label.modulate = Color("d6b968")
		anchor.add_child(label)
		var player := _find_animation(actor)
		if player != null:
			animations[id] = player
			for clip in player.get_animation_list():
				if String(clip).to_lower().ends_with("idle"):
					player.play(clip)
					break
func _find_animation(node: Node) -> AnimationPlayer:
	if node is AnimationPlayer:
		return node as AnimationPlayer
	for child in node.get_children():
		var nested := _find_animation(child)
		if nested:
			return nested
	return null
