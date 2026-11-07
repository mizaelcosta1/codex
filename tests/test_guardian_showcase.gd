extends SceneTree
## Smoke test after GLB import: all 5 characters must exist and be animated.
const Catalog = preload("res://scripts/guardian_asset_catalog.gd")
const Showcase = preload("res://scripts/guardian_showcase.gd")
var failures := 0
var checks := 0

func _initialize() -> void:
	call_deferred("_run")

func verify(ok: bool, label: String) -> void:
	checks += 1
	if ok:
		print("PASS ", label)
	else:
		failures += 1
		push_error("FAIL " + label)

func _run() -> void:
	var available: Dictionary = Catalog.load_available()
	verify(available.size() == 5, "Os cinco novos GLBs foram importados")
	var exhibit := Showcase.new()
	root.add_child(exhibit)
	exhibit.populate(available)
	verify(exhibit.characters.size() == 5, "Cinco personagens instanciados na vitrine")
	for name in Catalog.ids():
		verify(exhibit.characters.has(name), "Personagem presente: " + name)
		var actor: Node3D = exhibit.characters.get(name)
		verify(actor != null and actor.get_parent() != null, "Node3D valido: " + name)
		verify(exhibit.animations.has(name), "AnimationPlayer: " + name)
		if exhibit.animations.has(name):
			var player: AnimationPlayer = exhibit.animations[name]
			verify(player.get_animation_list().size() >= 6, "Seis clips: " + name)
	verify(exhibit.get_child_count() == 5, "Vitrine sem placeholders")
	print("GUARDIAN_SHOWCASE_RESULT ", checks - failures, "/", checks)
	exhibit.queue_free()
	quit(1 if failures > 0 else 0)
