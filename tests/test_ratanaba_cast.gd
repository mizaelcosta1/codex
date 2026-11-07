extends SceneTree
const Catalog = preload("res://scripts/ratanaba_cast_catalog.gd")
const Gallery = preload("res://scripts/ratanaba_cast_showcase.gd")
var failures := 0
func check(ok: bool, message: String) -> void:
	if not ok:
		failures += 1
		push_error("FAIL: " + message)
	else:
		print("PASS: " + message)
func _initialize() -> void:
	call_deferred("run")
func run() -> void:
	var available := Catalog.load_available()
	check(available.size() == 6, "six character GLBs imported")
	var gallery := Gallery.new()
	root.add_child(gallery)
	gallery.populate(available)
	check(gallery.characters.size() == 6, "six rigged characters instantiated")
	for id in Catalog.ids():
		check(gallery.characters.has(id), id + " instantiated")
		check(gallery.animations.has(id), id + " AnimationPlayer")
		if not gallery.animations.has(id):
			continue
		var player: AnimationPlayer = gallery.animations[id]
		check(player.get_animation_list().size() >= 6, id + " six clips")
		for required in Catalog.SPECS[id]["clips"]:
			var found := false
			for clip in player.get_animation_list():
				if String(clip).to_lower().ends_with(String(required).to_lower()):
					found = true
			check(found, id + " " + required)
	gallery.queue_free()
	print("RATANABA_CAST_GODOT_TEST", "PASS" if failures == 0 else "FAIL")
	quit(1 if failures > 0 else 0)
