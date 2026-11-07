extends SceneTree
var game
func _initialize(): call_deferred("run_routes")
func run_routes():
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	await physics_frame
	game.menu_action()
	# Isolate route accessibility from combat balance. No teleports or collision bypass.
	for enemy in game.enemies: enemy.set_physics_process(false)
	var report: Array = []
	for target in [Vector3(-18,0,0),Vector3(0,0,-17),Vector3(17,0,4)]:
		var frames = 0
		while Vector2(game.player.position.x-target.x,game.player.position.z-target.z).length()>1.7 and frames<1200:
			var d = Vector2(target.x-game.player.position.x,target.z-game.player.position.z).normalized()
			game.hud.joystick.value = d
			await physics_frame
			frames += 1
		game.hud.joystick.reset()
		var reached = Vector2(game.player.position.x-target.x,game.player.position.z-target.z).length()<=1.7
		if not reached:
			push_error("Route blocked at "+str(game.player.position)+" targeting "+str(target))
			quit(1)
			return
		assert(game.interact())
		report.append({"target":[target.x,target.z],"physics_frames":frames,"reached":reached})
	assert(game.activated==3)
	DirAccess.make_dir_recursive_absolute("res://build")
	var f = FileAccess.open("res://build/routes_results.json",FileAccess.WRITE)
	f.store_string(JSON.stringify(report,"\t"))
	f.close()
	print("ROUTES_RESULT: all three shrines reached using movement and collisions")
	game.stop_audio()
	await create_timer(.15).timeout
	game.queue_free()
	await process_frame
	OS.delay_msec(200)
	quit()
