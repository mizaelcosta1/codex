extends Node3D
const PlayerScript = preload("res://scripts/player.gd")
const EnemyScript = preload("res://scripts/enemy.gd")
const GuardianAssetCatalog = preload("res://scripts/guardian_asset_catalog.gd")
var state = "menu"
var world: Node3D
var player
var boss
var camera: Camera3D
var hud
var models: Dictionary = {}
var guardian_models: Dictionary = {}
var materials: Dictionary = {}
var enemies: Array = []
var shrines: Array = []
var npcs: Array = []
var seeds: Array = []
var projectiles: Array = []
var effects: Array = []
var activated = 0
var elapsed = 0.0
var notice_time = 0.0
var iara_cooldown = 0.0
var best_time = 0.0
var sound_enabled = true
var ambience: AudioStreamPlayer
var fx_audio: Array = []
var rng = RandomNumberGenerator.new()
func _ready():
	process_mode = Node.PROCESS_MODE_ALWAYS
	rng.seed = 7442
	setup_input()
	load_settings()
	for name in ["curupira","saci","cuca","iara","boitata","arvore","pedra","samambaia","altar","ponte","cabana","orbe"]: models[name] = load("res://assets/models/"+name+".glb")
	guardian_models = GuardianAssetCatalog.load_available()
	build_environment()
	build_level()
	hud = load("res://scripts/hud.gd").new()
	hud.game = self
	add_child(hud)
	setup_audio()
	hud.show_menu("GUARDIÕES\nDA MATA","A floresta perdeu sua proteção.\nRestaure três santuários e enfrente a Cuca.","ENTRAR NA MATA")
	hud.refresh()
	set_sound(sound_enabled)
	get_tree().auto_accept_quit = false
	get_tree().quit_on_go_back = false
func setup_input():
	var bindings = {"left":[KEY_A,KEY_LEFT],"right":[KEY_D,KEY_RIGHT],"up":[KEY_W,KEY_UP],"down":[KEY_S,KEY_DOWN],"attack":[KEY_J],"dodge":[KEY_K],"jump":[KEY_SPACE],"interact":[KEY_E],"pause_game":[KEY_ESCAPE]}
	for action in bindings:
		if not InputMap.has_action(action): InputMap.add_action(action)
		for key in bindings[action]:
			var event = InputEventKey.new()
			event.physical_keycode = key
			InputMap.action_add_event(action,event)
func _notification(what):
	if what==NOTIFICATION_APPLICATION_FOCUS_OUT and state=="playing": toggle_pause()
	if what==NOTIFICATION_WM_GO_BACK_REQUEST and state in ["playing","paused"]: toggle_pause()
	if what==NOTIFICATION_WM_CLOSE_REQUEST:
		save_settings()
		get_tree().quit()
func _unhandled_input(event):
	if event.is_action_pressed("pause_game") and state in ["playing","paused"]: toggle_pause()
func material(name,color,glow=false):
	if materials.has(name): return materials[name]
	var m = StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = .9
	if glow:
		m.emission_enabled = true
		m.emission = color
		m.emission_energy_multiplier = 1.8
	materials[name] = m
	return m
func build_environment():
	var env = WorldEnvironment.new()
	var e = Environment.new()
	e.background_mode = Environment.BG_COLOR
	e.background_color = Color("243b37")
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("a5c1b4")
	e.ambient_light_energy = .45
	e.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	e.fog_enabled = true
	e.fog_light_color = Color("526958")
	e.fog_density = .009
	env.environment = e
	add_child(env)
	var sun = DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-48,-32,0)
	sun.light_color = Color("ffe0a0")
	sun.light_energy = 1.05
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 38
	add_child(sun)
	camera = Camera3D.new()
	camera.fov = 48
	camera.far = 100
	camera.current = true
	add_child(camera)
func model(name,parent,at,scale_factor=1.0):
	var o = models[name].instantiate()
	parent.add_child(o)
	o.position = at
	o.scale = Vector3.ONE*scale_factor
	limit_visibility(o)
	return o
func limit_visibility(node):
	if node is MeshInstance3D:
		node.visibility_range_end = 48
		node.visibility_range_end_margin = 3
	for child in node.get_children(): limit_visibility(child)
func solid_box(at,dimensions,mat,visible_box=true):
	var body = StaticBody3D.new()
	body.collision_layer = 1
	body.collision_mask = 0
	world.add_child(body)
	body.position = at
	var collider = CollisionShape3D.new()
	var box = BoxShape3D.new()
	box.size = dimensions
	collider.shape = box
	body.add_child(collider)
	if visible_box:
		var mesh = MeshInstance3D.new()
		var shape = BoxMesh.new()
		shape.size = dimensions
		mesh.mesh = shape
		mesh.material_override = mat
		body.add_child(mesh)
	return body
func ground_disc(at,radius,mat):
	var m = MeshInstance3D.new()
	var disc = CylinderMesh.new()
	disc.top_radius = radius
	disc.bottom_radius = radius
	disc.height = .025
	disc.radial_segments = 32
	m.mesh = disc
	m.material_override = mat
	world.add_child(m)
	m.position = at
	return m
func build_level():
	world = Node3D.new()
	world.name = "MataEncantada"
	add_child(world)
	var ground = material("ground",Color("40543a"))
	var path = material("path",Color("695638"))
	for pair in [[ground,Color("283e28"),Color("62704c")],[path,Color("433727"),Color("827152")]]:
		var noise = FastNoiseLite.new()
		noise.frequency = .12
		noise.fractal_octaves = 3
		var gradient = Gradient.new()
		gradient.set_color(0,pair[1])
		gradient.set_color(1,pair[2])
		var texture = NoiseTexture2D.new()
		texture.width = 128
		texture.height = 128
		texture.noise = noise
		texture.color_ramp = gradient
		texture.seamless = true
		pair[0].albedo_color = Color.WHITE
		pair[0].albedo_texture = texture
		pair[0].uv1_scale = Vector3(12,12,1) if pair[0]==ground else Vector3(1,6,1)
	solid_box(Vector3(0,-.3,0),Vector3(66,.6,66),ground)
	var routes = [[Vector3(0,0,20),Vector3(-18,0,0)],[Vector3(0,0,20),Vector3(17,0,4)],[Vector3(-18,0,0),Vector3(0,0,-17)],[Vector3(17,0,4),Vector3(0,0,-17)],[Vector3(0,0,-17),Vector3(0,0,-26)]]
	for route in routes:
		var distance = route[0].distance_to(route[1])
		var strip = MeshInstance3D.new()
		var plane = PlaneMesh.new()
		plane.size = Vector2(3.5,distance+.8)
		strip.mesh = plane
		strip.material_override = path
		world.add_child(strip)
		strip.position = (route[0]+route[1])*.5+Vector3(0,.025,0)
		var d = route[1]-route[0]
		strip.rotation.y = atan2(d.x,d.z)
		ground_disc(route[0]+Vector3(0,.024,0),1.8,path)
		ground_disc(route[1]+Vector3(0,.024,0),1.8,path)
	var water = material("water",Color("357e83"))
	water.roughness = .18
	water.metallic = .25
	ground_disc(Vector3(18,.045,1),5.5,water)
	# The bridge and rails follow the actual diagonal trail through the lagoon.
	var bridge_center = Vector3(17.0*18.0/21.0,.08,1)
	var bridge_angle = -atan2(21.0,17.0)
	var bridge = model("ponte",world,bridge_center,1.2)
	bridge.rotation.y = bridge_angle
	for side in [-.8,.8]:
		var rail = solid_box(bridge_center+bridge.basis.orthonormalized()*Vector3(0,.62,side),Vector3(4.8,.25,.12),ground,false)
		rail.rotation.y = bridge_angle
	model("cabana",world,Vector3(-4,0,22))
	for x in [-5.4,-2.6]: solid_box(Vector3(x,.8,22),Vector3(.3,1.6,2.5),ground,false)
	model("cabana",world,Vector3(0,0,-28),1.25)
	for pos in [Vector3(-18,0,0),Vector3(17,0,4),Vector3(0,0,-17)]:
		ground_disc(pos+Vector3(0,.05,0),2.6,path)
		var altar = model("altar",world,pos)
		shrines.append({"position":pos,"node":altar,"active":false})
		solid_box(pos+Vector3(0,.3,0),Vector3(.8,.6,.8),ground,false)
		var light = OmniLight3D.new()
		light.light_color = Color("edc568")
		light.light_energy = .6
		light.omni_range = 4
		altar.add_child(light)
		light.position.y = 1.8
	for i in range(105):
		var pos = Vector3(rng.randf_range(-32,32),0,rng.randf_range(-32,32))
		var blocked = absf(pos.x)<3.2 or pos.distance_to(Vector3(18,0,1))<7 or pos.distance_to(Vector3(-7,0,14))<3
		for route in routes:
			if pos.distance_to(Geometry3D.get_closest_point_to_segment(pos,route[0],route[1]))<3.3: blocked = true
		if blocked: continue
		var tree = model("arvore",world,pos,rng.randf_range(.85,1.5))
		tree.rotation.y = rng.randf_range(-PI,PI)
		solid_box(pos+Vector3.UP,Vector3(.65,2,.65),ground,false)
		if i%4==0: model("samambaia",world,pos+Vector3(1,0,1),.8)
	for i in range(28):
		var angle = i*TAU/28
		model("pedra",world,Vector3(cos(angle)*30,0,sin(angle)*30),rng.randf_range(1,2))
	for x in [-33,33]: solid_box(Vector3(x,2,0),Vector3(1,6,68),ground,false)
	for z in [-33,33]: solid_box(Vector3(0,2,z),Vector3(68,6,1),ground,false)
	player = PlayerScript.new()
	player.game = self
	world.add_child(player)
	player.position = Vector3(0,.1,19)
	for spec in [["saci",Vector3(-7,0,14)],["iara",Vector3(19,0,2)]]:
		var actor = model(spec[0],world,spec[1])
		actor.rotation.y = PI*.6
		npcs.append({"kind":spec[0],"position":spec[1],"node":actor})
	for spec in [["cuca",Vector3(0,0,-25)],["boitata",Vector3(-7,0,-8)]]:
		var enemy = EnemyScript.new()
		enemy.game = self
		enemy.kind = spec[0]
		enemy.position = spec[1]
		world.add_child(enemy)
		enemies.append(enemy)
		if enemy.kind=="cuca": boss = enemy
	for pos in [Vector3(-6,0,8),Vector3(7,0,11),Vector3(-15,0,-5),Vector3(10,0,-7),Vector3(-5,0,-17)]: seeds.append({"position":pos,"node":model("orbe",world,pos),"taken":false})
	camera.position = player.position+Vector3(0,10,12)
	camera.look_at(player.position+Vector3.UP)
func _process(delta):
	if not hud: return
	hud.refresh()
	if state!="playing": return
	elapsed += delta
	iara_cooldown = maxf(0,iara_cooldown-delta)
	camera.position = camera.position.lerp(player.position+Vector3(0,10,12),1-exp(-delta*7))
	camera.look_at(player.position+Vector3(0,.7,-1))
	for seed in seeds:
		if seed.taken: continue
		seed.node.position.y = .15+sin(elapsed*2+seed.position.x)*.12
		seed.node.rotation.y += delta
		if player.position.distance_to(seed.position)<1.1:
			seed.taken = true
			seed.node.hide()
			player.health = minf(100,player.health+15)
			play_sound("restore")
	for p in projectiles.duplicate():
		p.age += delta
		p.node.position += p.velocity*delta
		if p.node.position.distance_to(player.position+Vector3.UP*.8)<.65:
			player.damage(14)
			p.age = 10
		if p.age>6:
			p.node.queue_free()
			projectiles.erase(p)
	for effect in effects.duplicate():
		effect.ttl -= delta
		effect.node.scale += Vector3.ONE*delta*2
		if effect.ttl<=0:
			effect.node.queue_free()
			effects.erase(effect)
	if notice_time>0: notice_time -= delta
	else:
		hud.hint.text = ""
		for shrine in shrines:
			if not shrine.active and player.position.distance_to(shrine.position)<2.6: hud.hint.text = "USAR · restaurar santuário"
		for npc in npcs:
			if player.position.distance_to(npc.position)<3: hud.hint.text = "USAR · conversar com "+npc.kind.capitalize()
func in_water(pos):
	var center = Vector3(17.0*18.0/21.0,0,1)
	var along = Vector3(17,0,21).normalized()*2.5
	var flat = Vector3(pos.x,0,pos.z)
	if flat.distance_to(Geometry3D.get_closest_point_to_segment(flat,center-along,center+along))<.75: return false
	return Vector2(pos.x-18,pos.z-1).length()<5.2
func interact():
	if state!="playing": return false
	for shrine in shrines:
		if not shrine.active and player.position.distance_to(shrine.position)<2.6:
			shrine.active = true
			activated += 1
			player.health = minf(100,player.health+25)
			ground_disc(shrine.position+Vector3(0,.09,0),2,material("restored",Color("98b965"),true))
			play_sound("restore")
			message("Santuário restaurado!" if activated<3 else "A proteção caiu. Enfrente a Cuca!")
			return true
	for npc in npcs:
		if player.position.distance_to(npc.position)<3:
			if npc.kind=="saci": message("Saci: siga os pontos dourados. Use a esquiva para escapar do fogo!")
			elif iara_cooldown<=0:
				player.health = 100
				iara_cooldown = 30
				play_sound("restore")
				message("Iara: minhas águas renovam sua força. Proteja a nascente.")
			else: message("Iara: minhas águas precisam descansar. Volte em instantes.")
			return true
	message("Aproxime-se de um santuário, do Saci ou da Iara.")
	return false
func attack_at(pos,facing):
	var ring = ground_disc(pos+facing*.9+Vector3(0,.12,0),1.1,material("attack",Color("c4d39a"),true))
	effects.append({"node":ring,"ttl":.16})
	for enemy in enemies:
		if enemy.dead: continue
		var d = enemy.position-pos
		d.y = 0
		if d.length()<3 and (d.length()<.5 or facing.dot(d.normalized())>-.1): enemy.damage(25)
func spawn_projectile(origin,target):
	var mesh = MeshInstance3D.new()
	var sphere = SphereMesh.new()
	sphere.radius = .22
	sphere.height = .44
	sphere.radial_segments = 12
	sphere.rings = 6
	mesh.mesh = sphere
	mesh.material_override = material("poison",Color("a35fbf"),true)
	world.add_child(mesh)
	mesh.position = origin
	projectiles.append({"node":mesh,"velocity":(target-origin).normalized()*5,"age":0.0})
func message(content):
	if hud: hud.hint.text = content
	notice_time = 4
func menu_action():
	if state=="paused":
		state = "playing"
		get_tree().paused = false
		hud.hide_menu()
	elif state in ["won","lost"]: restart()
	elif state=="menu":
		state = "playing"
		hud.hide_menu()
		message("Explore a mata. Restaure os três pontos dourados do mapa.")
func toggle_pause():
	if state=="playing":
		state = "paused"
		get_tree().paused = true
		hud.show_menu("A MATA\nESPERA","Respire. Sua jornada continua.","CONTINUAR")
	elif state=="paused": menu_action()
func restart():
	get_tree().paused = false
	state = "playing"
	activated = 0
	elapsed = 0
	iara_cooldown = 0
	notice_time = 0
	for array in [enemies,shrines,npcs,seeds,projectiles,effects]: array.clear()
	remove_child(world)
	world.queue_free()
	rng.seed = 7442
	build_level()
	hud.hide_menu()
func finish(won):
	if state!="playing": return
	state = "won" if won else "lost"
	if won:
		if best_time<=0 or elapsed<best_time: best_time = elapsed
		save_settings()
		play_sound("win")
		hud.show_menu("A MATA\nRENASCE","Você restaurou os santuários e derrotou a Cuca.\nTempo: %02d:%02d · Melhor: %02d:%02d" % [int(elapsed)/60,int(elapsed)%60,int(best_time)/60,int(best_time)%60],"JOGAR NOVAMENTE")
	else:
		play_sound("hurt")
		hud.show_menu("A MATA\nPRECISA DE VOCÊ","Use a esquiva e procure a cura da Iara.","TENTAR NOVAMENTE")
func setup_audio():
	ambience = AudioStreamPlayer.new()
	ambience.stream = load("res://assets/audio/forest.wav")
	ambience.stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	ambience.stream.loop_end = int(ambience.stream.get_length()*ambience.stream.mix_rate)
	ambience.volume_db = -13
	add_child(ambience)
	ambience.play()
	for i in range(4):
		var channel = AudioStreamPlayer.new()
		channel.volume_db = -8
		add_child(channel)
		fx_audio.append(channel)
func play_sound(name):
	if not sound_enabled: return
	for channel in fx_audio:
		if not channel.playing:
			channel.stream = load("res://assets/audio/"+name+".wav")
			channel.play()
			return
func set_sound(enabled):
	sound_enabled = enabled
	AudioServer.set_bus_mute(0,not enabled)
	save_settings()
	if hud: hud.refresh()
func load_settings():
	var config = ConfigFile.new()
	if config.load("user://settings.cfg")==OK:
		sound_enabled = config.get_value("audio","enabled",true)
		best_time = config.get_value("game","best_time",0.0)
func save_settings():
	var config = ConfigFile.new()
	config.set_value("audio","enabled",sound_enabled)
	config.set_value("game","best_time",best_time)
	config.save("user://settings.cfg")
func stop_audio():
	if is_instance_valid(ambience):
		ambience.stop()
		ambience.stream = null
	for channel in fx_audio:
		channel.stop()
		channel.stream = null
func _exit_tree(): stop_audio()
