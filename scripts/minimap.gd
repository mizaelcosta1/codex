extends Control
var game
func _ready(): mouse_filter = Control.MOUSE_FILTER_IGNORE
func _process(_delta): queue_redraw()
func point(pos): return size*.5+Vector2(pos.x,pos.z)/70*size
func _draw():
	draw_style_box(background(),Rect2(Vector2.ZERO,size))
	if not game or not game.player: return
	for shrine in game.shrines: draw_circle(point(shrine.position),4,Color("9bc582") if shrine.active else Color("eabf75"))
	if is_instance_valid(game.boss) and not game.boss.dead: draw_circle(point(game.boss.position),5,Color("d8675a"))
	draw_circle(point(game.player.position),4,Color.WHITE)
	draw_line(point(game.player.position),point(game.player.position+game.player.facing*4),Color.WHITE,2)
func background():
	var s = StyleBoxFlat.new()
	s.bg_color = Color(.02,.06,.04,.86)
	s.border_color = Color("928867")
	s.set_border_width_all(1)
	s.set_corner_radius_all(12)
	return s
