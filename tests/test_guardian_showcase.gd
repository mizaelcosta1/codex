extends SceneTree
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
	var exhibit := Showcase.new()
	root.add_child(exhibit)
	exhibit.populate(available)
	verify(exhibit.characters.size() == available.size(), "GLBs disponiveis instanciados")
	for name in available:
		verify(exhibit.characters.has(name), "Personagem instanciado: " + str(name))
		var actor: Node3D = exhibit.characters.get(name)
		verify(actor != null and actor.get_parent() != null, "Raiz Node3D: " + str(name))
	verify(exhibit.get_child_count() == exhibit.characters.size(), "Sem placeholders para GLBs ausentes")
	print("GUARDIAN_SHOWCASE_RESULT ", checks - failures, "/", checks)
	exhibit.queue_free()
	quit(1 if failures > 0 else 0)
