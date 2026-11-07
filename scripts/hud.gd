extends CanvasLayer
var game
var root: Control
var controls: Control
var joystick
var life: ProgressBar
var energy: ProgressBar
var objective: Label
var counter: Label
var hint: Label
var boss_bar: ProgressBar
var boss_name: Label
var menu: Control
var menu_title: Label
var menu_description: Label
var main_button: Button
var sound_button: Button
var actions: Dictionary = {}
func label(parent,content,px=22):
	var l = Label.new()
	l.text = content
	l.add_theme_font_size_override("font_size",px)
	l.add_theme_color_override("font_color",Color("f1e9ce"))
	parent.add_child(l)
	return l
func style(color,border):
	var s = StyleBoxFlat.new()
	s.bg_color = color
	s.border_color = border
	s.set_border_width_all(1)
	s.set_corner_radius_all(10)
	return s
func bar(parent,color,width,height):
	var b = ProgressBar.new()
	b.custom_minimum_size = Vector2(width,height)
	b.show_percentage = false
	b.value = 100
	b.add_theme_stylebox_override("background",style(Color("142a22"),Color("777456")))
	b.add_theme_stylebox_override("fill",style(color,color))
	parent.add_child(b)
	return b
func place(n,anchor,pos,dimensions):
	n.anchor_left = anchor.x
	n.anchor_right = anchor.x
	n.anchor_top = anchor.y
	n.anchor_bottom = anchor.y
	n.offset_left = pos.x
	n.offset_top = pos.y
	n.offset_right = pos.x+dimensions.x
	n.offset_bottom = pos.y+dimensions.y
func _ready():
	process_mode = Node.PROCESS_MODE_ALWAYS
	root = Control.new()
	add_child(root)
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	controls = Control.new()
	root.add_child(controls)
	controls.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	controls.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var info = VBoxContainer.new()
	controls.add_child(info)
	place(info,Vector2.ZERO,Vector2(30,24),Vector2(290,95))
	label(info,"CURUPIRA  /  GUARDIÃO DA MATA",16)
	life = bar(info,Color("a74b43"),290,16)
	energy = bar(info,Color("8ba56c"),290,9)
	counter = label(info,"",16)
	objective = label(controls,"",21)
	place(objective,Vector2(.5,0),Vector2(-225,26),Vector2(450,40))
	objective.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint = label(controls,"",21)
	place(hint,Vector2(.5,1),Vector2(-330,-80),Vector2(660,50))
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	hint.add_theme_color_override("font_color",Color("f8d28e"))
	joystick = load("res://scripts/touch_control.gd").new()
	joystick.joystick = true
	controls.add_child(joystick)
	place(joystick,Vector2(0,1),Vector2(30,-205),Vector2(180,180))
	for spec in [["ATACAR",Vector2(-145,-145),Vector2(110,110),"attack"],["ESQUIVA",Vector2(-255,-110),Vector2(95,95),"dodge"],["PULAR",Vector2(-140,-250),Vector2(90,90),"jump"],["USAR",Vector2(-245,-220),Vector2(90,90),"interact"]]:
		var action = load("res://scripts/touch_control.gd").new()
		action.caption = spec[0]
		controls.add_child(action)
		place(action,Vector2.ONE,spec[1],spec[2])
		actions[spec[3]] = action
		action.activated.connect(_action.bind(spec[3]))
	var map = load("res://scripts/minimap.gd").new()
	map.game = game
	controls.add_child(map)
	place(map,Vector2(1,0),Vector2(-185,25),Vector2(125,125))
	var pause = Button.new()
	pause.text = "Ⅱ"
	pause.add_theme_font_size_override("font_size",22)
	controls.add_child(pause)
	place(pause,Vector2(1,0),Vector2(-55,25),Vector2(40,48))
	pause.pressed.connect(game.toggle_pause)
	boss_name = label(controls,"CUCA",16)
	place(boss_name,Vector2(.5,0),Vector2(-150,85),Vector2(300,20))
	boss_name.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	boss_bar = bar(controls,Color("8b5c9c"),300,10)
	boss_bar.max_value = 150
	place(boss_bar,Vector2(.5,0),Vector2(-150,112),Vector2(300,10))
	build_menu()
	get_viewport().size_changed.connect(safe_area)
	safe_area()
func _action(action):
	if action=="interact": game.interact()
	else: game.player.call(action)
func safe_area():
	if not OS.has_feature("mobile"): return
	var area = DisplayServer.get_display_safe_area()
	var window = DisplayServer.window_get_size()
	if window.x<=0 or area.size.x<=0: return
	var ratio = root.size/Vector2(window)
	controls.offset_left = area.position.x*ratio.x
	controls.offset_top = area.position.y*ratio.y
	controls.offset_right = -(window.x-area.end.x)*ratio.x
	controls.offset_bottom = -(window.y-area.end.y)*ratio.y
func build_menu():
	menu = Control.new()
	root.add_child(menu)
	menu.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var shade = ColorRect.new()
	shade.color = Color(.01,.035,.025,.87)
	menu.add_child(shade)
	shade.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var center = CenterContainer.new()
	menu.add_child(center)
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	var panel = VBoxContainer.new()
	panel.custom_minimum_size = Vector2(610,0)
	panel.add_theme_constant_override("separation",16)
	center.add_child(panel)
	var eyebrow = label(panel,"UMA AVENTURA DO FOLCLORE BRASILEIRO",15)
	eyebrow.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	eyebrow.add_theme_color_override("font_color",Color("c4ac76"))
	menu_title = label(panel,"GUARDIÕES\nDA MATA",52)
	menu_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	menu_description = label(panel,"",21)
	menu_description.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	main_button = Button.new()
	main_button.custom_minimum_size.y = 58
	main_button.add_theme_stylebox_override("normal",style(Color("a7ba83"),Color("d6dca1")))
	main_button.add_theme_color_override("font_color",Color("17291e"))
	main_button.add_theme_font_size_override("font_size",22)
	panel.add_child(main_button)
	main_button.pressed.connect(game.menu_action)
	sound_button = Button.new()
	sound_button.custom_minimum_size.y = 46
	panel.add_child(sound_button)
	sound_button.pressed.connect(func():game.set_sound(not game.sound_enabled))
	var instructions = "Mover: joystick  •  Ações: botões à direita\nUSAR: conversar e restaurar santuários" if OS.has_feature("mobile") else "WASD/setas: mover  •  J: atacar  •  Espaço: pular\nK: esquivar  •  E: usar  •  Esc: pausar"
	var credits = label(panel,instructions+"\nGodot Engine · MIT · Versão 0.1.0",16)
	credits.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
func show_menu(title,description,button):
	menu_title.text = title
	menu_description.text = description
	main_button.text = button
	menu.show()
	controls.hide()
	joystick.reset()
	for a in actions.values(): a.reset()
func hide_menu():
	menu.hide()
	controls.show()
func refresh():
	if not game.player: return
	life.value = game.player.health
	energy.value = game.player.stamina
	counter.text = "%d/3 santuários  ·  %02d:%02d" % [game.activated,int(game.elapsed)/60,int(game.elapsed)%60]
	objective.text = "Restaure os santuários da mata" if game.activated<3 else "Derrote a Cuca"
	var visible_boss = game.state=="playing" and is_instance_valid(game.boss) and game.boss.position.distance_to(game.player.position)<19
	boss_name.visible = visible_boss
	boss_bar.visible = visible_boss
	if visible_boss: boss_bar.value = game.boss.health
	sound_button.text = "SOM: ATIVADO" if game.sound_enabled else "SOM: DESATIVADO"
