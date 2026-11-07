extends SceneTree
func _initialize():
	DirAccess.make_dir_recursive_absolute("res://build")
	call_deferred("capture")
func capture():
	var game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	for i in range(8): await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://build/menu.png")
	game.menu_action()
	for i in range(40): await process_frame
	await RenderingServer.frame_post_draw
	root.get_texture().get_image().save_png("res://build/gameplay.png")
	game.stop_audio()
	await create_timer(.15).timeout
	game.queue_free()
	await process_frame
	OS.delay_msec(200)
	print("SCREENSHOTS_SAVED")
	quit()
