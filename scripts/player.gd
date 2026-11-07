extends CharacterBody3D
var game
var visual: Node3D
var animation: AnimationPlayer
var health = 100.0
var stamina = 100.0
var invulnerable = 0.0
var attack_cooldown = 0.0
var dash_timer = 0.0
var facing = Vector3.FORWARD
var last_clip = ""
func _ready():
	collision_layer = 2
	collision_mask = 1
	var shape = CollisionShape3D.new()
	var capsule = CapsuleShape3D.new()
	capsule.radius = .3
	capsule.height = 1.6
	shape.shape = capsule
	shape.position.y = .8
	add_child(shape)
	var character_path := "res://assets/ratanaba/o_banido.glb"
	# Preserva Curupira como fallback caso o novo asset nao esteja instalado.
	visual = load(character_path).instantiate() if ResourceLoader.exists(character_path) else load("res://assets/models/curupira.glb").instantiate()
	add_child(visual)
	visual.rotation.y = PI
	animation = find_animation(visual)
func find_animation(node) -> AnimationPlayer:
	if node is AnimationPlayer: return node
	for child in node.get_children():
		var found = find_animation(child)
		if found: return found
	return null
func play_clip(clip):
	if not animation or last_clip == clip: return
	for name in animation.get_animation_list():
		if String(clip).to_lower() in String(name).to_lower():
			animation.get_animation(name).loop_mode = Animation.LOOP_NONE if clip == "Attack" else Animation.LOOP_LINEAR
			animation.play(name,.15)
			last_clip = clip
			return
func _physics_process(delta):
	if not game or game.state != "playing": return
	invulnerable = maxf(0,invulnerable-delta)
	attack_cooldown = maxf(0,attack_cooldown-delta)
	dash_timer = maxf(0,dash_timer-delta)
	stamina = minf(100,stamina+20*delta)
	var axis = Input.get_vector("left","right","up","down")
	if game.hud.joystick.value.length()>.1: axis = game.hud.joystick.value
	var direction = Vector3(axis.x,0,axis.y).limit_length()
	if direction.length()>.1:
		facing = direction.normalized()
		visual.rotation.y = lerp_angle(visual.rotation.y,atan2(facing.x,facing.z),delta*12)
	var speed = 3.0 if game.in_water(position) else 5.0
	if dash_timer>0:
		direction = facing
		speed = 13
	velocity.x = direction.x*speed
	velocity.z = direction.z*speed
	if not is_on_floor(): velocity.y -= 20*delta
	move_and_slide()
	position.x = clampf(position.x,-31,31)
	position.z = clampf(position.z,-31,31)
	if position.y < -10: position = Vector3(0,2,19)
	for a in ["attack","dodge","jump"]:
		if Input.is_action_just_pressed(a): call(a)
	if Input.is_action_just_pressed("interact"): game.interact()
	if attack_cooldown>.25: play_clip("Attack")
	elif direction.length()>.1: play_clip("Walk")
	else: play_clip("Idle")
	visual.visible = invulnerable<=0 or int(invulnerable*12)%2==0
func attack():
	if game.state!="playing" or attack_cooldown>0 or stamina<12: return false
	stamina -= 12
	attack_cooldown = .55
	last_clip = ""
	game.attack_at(position,facing)
	game.play_sound("attack")
	return true
func dodge():
	if game.state!="playing" or dash_timer>0 or stamina<28: return false
	stamina -= 28
	dash_timer = .22
	invulnerable = .45
	return true
func jump():
	if game.state!="playing" or not is_on_floor(): return false
	velocity.y = 7
	return true
func damage(amount):
	if game.state!="playing" or invulnerable>0: return false
	health = maxf(0,health-amount)
	invulnerable = .85
	game.play_sound("hurt")
	if OS.has_feature("mobile"): Input.vibrate_handheld(35)
	if health<=0: game.finish(false)
	return true
