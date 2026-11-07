extends Control
signal activated
var caption = ""
var joystick = false
var value = Vector2.ZERO
var finger = -1
var glow = 0.0
func _ready(): mouse_filter = Control.MOUSE_FILTER_IGNORE
func reset():
	value = Vector2.ZERO
	finger = -1
	queue_redraw()
func update_position(point):
	value = ((point-global_position-size*.5)/72).limit_length()
	queue_redraw()
func _input(event):
	if not is_visible_in_tree(): return
	if event is InputEventScreenTouch:
		if event.pressed and finger==-1 and get_global_rect().has_point(event.position):
			finger = event.index
			if joystick: update_position(event.position)
			else:
				glow = .15
				activated.emit()
			get_viewport().set_input_as_handled()
		elif not event.pressed and event.index==finger:
			reset()
			get_viewport().set_input_as_handled()
	if event is InputEventScreenDrag and joystick and event.index==finger:
		update_position(event.position)
		get_viewport().set_input_as_handled()
func _process(delta):
	glow = maxf(0,glow-delta)
	queue_redraw()
func _draw():
	var center = size*.5
	var radius = 72.0 if joystick else minf(size.x,size.y)*.46
	draw_circle(center,radius,Color("68724b") if glow>0 else Color(.025,.07,.05,.84))
	draw_arc(center,radius,0,TAU,48,Color("d9be83"),2,true)
	if joystick: draw_circle(center+value*40,28,Color("a1b685"))
	else:
		var font = ThemeDB.fallback_font
		var width = font.get_string_size(caption,HORIZONTAL_ALIGNMENT_LEFT,-1,18).x
		draw_string(font,Vector2(center.x-width/2,center.y+6),caption,HORIZONTAL_ALIGNMENT_LEFT,-1,18,Color("fff0ce"))
