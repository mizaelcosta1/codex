extends CharacterBody3D
var game
var kind = "cuca"
var health = 150.0
var cooldown = 2.0
var home = Vector3.ZERO
var visual: Node3D
var patrol_time = 0.0
var dead = false
func _ready():
	collision_layer = 4
	collision_mask = 1
	visual = load("res://assets/models/"+kind+".glb").instantiate()
	add_child(visual)
	if kind=="boitata": visual.position.z = -1.8
	var collider = CollisionShape3D.new()
	var shape = CapsuleShape3D.new()
	shape.radius = .6
	shape.height = 2
	collider.shape = shape
	collider.position.y = 1
	add_child(collider)
	home = position
func _physics_process(delta):
	if game.state!="playing" or dead: return
	cooldown -= delta
	patrol_time += delta
	var target = game.player.position
	var d = target-position
	d.y = 0
	var move = Vector3.ZERO
	if kind=="boitata":
		var patrol = home+Vector3(sin(patrol_time*.4)*7,0,cos(patrol_time*.4)*4)
		move = (patrol-position).normalized()*2.8
		if d.length()<7: move = d.normalized()*3.8
		if d.length()<2.2 and cooldown<=0:
			game.player.damage(18)
			cooldown = 1.4
	elif d.length()<17:
		if d.length()>5: move = d.normalized()*1.7
		if cooldown<=0:
			game.spawn_projectile(position+Vector3.UP,target+Vector3.UP)
			cooldown = 2.2 if game.activated<3 else 1.5
		if d.length()<1.7: game.player.damage(20)
	velocity.x = move.x
	velocity.z = move.z
	if not is_on_floor(): velocity.y -= 20*delta
	move_and_slide()
	if d.length()>.01: visual.rotation.y = atan2(d.x,d.z)
func damage(amount):
	if game.state!="playing" or dead: return false
	if kind=="cuca" and game.activated<3:
		game.message("Restaure os três santuários para remover a proteção da Cuca.")
		return false
	health -= amount
	if health<=0:
		dead = true
		if kind=="cuca": game.finish(true)
		else:
			hide()
			collision_layer = 0
			game.message("O fogo se acalmou. A mata agradece.")
	return true
