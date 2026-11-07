extends SceneTree
var game
var checks: Array = []
var failures = 0
func _initialize():
	DirAccess.make_dir_recursive_absolute("res://build")
	call_deferred("run_tests")
func check(condition,name):
	checks.append({"name":name,"passed":condition})
	if condition: print("PASS ",name)
	else:
		failures += 1
		push_error("FAIL "+name)
func frames(count):
	for i in range(count): await physics_frame
func touch(index,point,pressed):
	var e = InputEventScreenTouch.new()
	e.index = index
	e.position = point
	e.pressed = pressed
	root.push_input(e,true)
func run_tests():
	game = load("res://scenes/main.tscn").instantiate()
	root.add_child(game)
	await frames(4)
	check(game.state=="menu" and game.hud.menu.visible,"menu inicial")
	check(not game.get_tree().quit_on_go_back,"Voltar do Android é tratado pelo jogo")
	check(game.models.size()==12,"12 modelos GLB importados")
	check(game.player.animation!=null,"rig e AnimationPlayer importados")
	check(game.player.animation.get_animation_list().size()>=3,"clips de animação presentes")
	game.menu_action()
	await frames(12)
	check(game.state=="playing" and not game.hud.menu.visible,"início da partida")
	check(game.player.is_on_floor(),"colisão com o chão")
	var hp = game.boss.health
	check(not game.boss.damage(25) and game.boss.health==hp,"proteção da Cuca")
	var start = game.player.position
	Input.action_press("right")
	await frames(35)
	Input.action_release("right")
	check(game.player.position.x>start.x+1.5,"movimento real por física")
	check(game.player.visual.basis.z.dot(game.player.facing)>.95,"orientação visual acompanha movimento")
	game.player.position = Vector3(31,0,19)
	Input.action_press("right")
	await frames(30)
	Input.action_release("right")
	check(game.player.position.x<=31.01,"limite do mapa")
	game.player.position = Vector3(0,.1,19)
	await frames(10)
	check(game.player.jump(),"pulo aceito no chão")
	await frames(8)
	check(game.player.position.y>.3,"pulo sobe")
	await frames(55)
	check(game.player.is_on_floor(),"pulo retorna ao chão")
	var energy = game.player.stamina
	check(game.player.dodge() and game.player.stamina<energy,"esquiva consome energia")
	check(not game.player.damage(20),"invulnerabilidade da esquiva")
	await frames(35)
	game.player.position = Vector3(0,.1,19)
	game.player.invulnerable = 0
	hp = game.player.health
	check(game.player.damage(10) and game.player.health==hp-10,"dano recebido")
	game.player.attack_cooldown = 0
	var joy = game.hud.joystick
	var center = joy.global_position+joy.size*.5
	touch(3,center+Vector2(55,0),true)
	await frames(2)
	check(joy.value.x>.6,"joystick por toque")
	var action = game.hud.actions.attack
	touch(4,action.global_position+action.size*.5,true)
	await frames(2)
	check(game.player.attack_cooldown>0 and joy.finger==3,"multitouch: mover e atacar")
	touch(4,action.global_position+action.size*.5,false)
	touch(3,center,false)
	await frames(2)
	check(joy.value==Vector2.ZERO and joy.finger==-1,"liberação do joystick")
	var old_time = game.elapsed
	game.toggle_pause()
	await frames(10)
	check(game.state=="paused" and game.elapsed==old_time,"pausa congela tempo")
	check(joy.value==Vector2.ZERO,"pausa limpa toque")
	game.menu_action()
	await frames(2)
	game.player.health = 30
	game.player.position = Vector3(19,0,2)
	check(game.interact() and game.player.health==100,"cura da Iara")
	game.player.health = 60
	game.interact()
	check(game.player.health==60,"cura com cooldown")
	game.player.position = game.seeds[0].position
	game.player.health = 50
	await frames(3)
	check(game.seeds[0].taken and game.player.health>50,"coleta de semente")
	game.player.position = Vector3(0,0,19)
	game.player.health = 100
	game.player.invulnerable = 0
	game.spawn_projectile(game.player.position+Vector3(0,.8,-2),game.player.position+Vector3.UP*.8)
	await frames(35)
	check(game.player.health<100,"projétil atinge jogador")
	var patrol_start = game.enemies[1].position
	await frames(30)
	check(game.enemies[1].position.distance_to(patrol_start)>.05,"Boitatá patrulha")
	for shrine in game.shrines:
		game.player.position = shrine.position+Vector3(0,.1,1.7)
		check(game.interact(),"restaurar santuário")
		var previous = game.activated
		game.interact()
		check(game.activated==previous,"santuário sem duplicação")
	check(game.activated==3,"três objetivos concluídos")
	game.player.position = game.boss.position+Vector3(0,.1,1.9)
	game.boss.cooldown = 0
	game.player.invulnerable = 100
	await frames(3)
	check(not game.projectiles.is_empty(),"Cuca dispara ao perceber jogador")
	game.player.facing = Vector3.FORWARD
	for i in range(6):
		game.player.attack_cooldown = 0
		game.player.stamina = 100
		game.player.attack()
	check(game.state=="won" and game.hud.menu.visible,"combate gera vitória")
	check(game.best_time>0,"melhor tempo registrado")
	game.restart()
	await frames(5)
	check(game.activated==0 and game.player.health==100 and game.projectiles.is_empty(),"reinício limpa estado")
	game.player.invulnerable = 0
	game.player.damage(150)
	check(game.state=="lost" and game.hud.menu.visible,"derrota")
	game.restart()
	await frames(5)
	check(game.state=="playing" and game.enemies.size()==2,"nova tentativa")
	game.set_sound(false)
	check(AudioServer.is_bus_mute(0),"controle de áudio")
	game.set_sound(true)
	var report = {"checks":checks,"passed":checks.size()-failures,"failed":failures,"engine":Engine.get_version_info().string}
	var out = FileAccess.open("res://build/test_results.json",FileAccess.WRITE)
	out.store_string(JSON.stringify(report,"\t"))
	out.close()
	print("TEST_RESULT ",checks.size()-failures,"/",checks.size()," passed")
	game.stop_audio()
	await create_timer(.15).timeout
	game.queue_free()
	await frames(2)
	OS.delay_msec(200)
	quit(1 if failures else 0)
