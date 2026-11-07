extends SceneTree
func _initialize(): call_deferred("export_map")
func set_owner_recursive(node,scene_root):
	for child in node.get_children():
		child.owner = scene_root
		set_owner_recursive(child,scene_root)
func export_map():
	var game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	await process_frame
	var preview = game.world.duplicate()
	preview.name = "MapaMataPreview"
	root.add_child(preview)
	for child in preview.get_children():
		if child is CharacterBody3D:
			preview.remove_child(child)
			child.free()
	set_owner_recursive(preview,preview)
	var scene = PackedScene.new()
	assert(scene.pack(preview)==OK)
	assert(ResourceSaver.save(scene,"res://scenes/map_preview.tscn")==OK)
	game.stop_audio()
	preview.queue_free()
	game.queue_free()
	await process_frame
	OS.delay_msec(200)
	print("STATIC_MAP_EXPORTED")
	quit()
