extends Control
## A cinematic video is optional. The game's loading must never depend on video decoding.
const GAME_SCENE := "res://scenes/main.tscn"
const INTRO_VIDEO := "res://assets/video/ratanaba_loading.ogv"
const MIN_SHOW_MS := 1800
var clip: VideoStreamPlayer
var bar: ProgressBar
var status_text: Label
var progress_value := 0.0
var started_ms := 0
var load_requested := false
var scene_transition_started := false

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	mouse_filter = Control.MOUSE_FILTER_STOP
	_build_screen()
	started_ms = Time.get_ticks_msec()
	call_deferred("_begin_loading")

func _build_screen() -> void:
	var background := ColorRect.new()
	background.color = Color("060e10")
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	clip = VideoStreamPlayer.new()
	clip.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	clip.expand = true
	clip.mouse_filter = Control.MOUSE_FILTER_IGNORE
	clip.finished.connect(_on_clip_finished)
	add_child(clip)

	var scrim := ColorRect.new()
	scrim.color = Color(0.01, 0.024, 0.03, 0.56)
	scrim.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	scrim.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(scrim)

	var layout := VBoxContainer.new()
	layout.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	layout.offset_left = 42
	layout.offset_right = -42
	layout.offset_top = 38
	layout.offset_bottom = -38
	layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(layout)

	var title := Label.new()
	title.text = "RATANABA GUARDIANS"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 39)
	title.add_theme_color_override("font_color", Color("e7d8b3"))
	layout.add_child(title)

	var tagline := Label.new()
	tagline.text = "CRONICAS DO EXILIO"
	tagline.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	tagline.add_theme_font_size_override("font_size", 16)
	tagline.add_theme_color_override("font_color", Color("93e7dd"))
	layout.add_child(tagline)

	var space := Control.new()
	space.size_flags_vertical = Control.SIZE_EXPAND_FILL
	layout.add_child(space)

	status_text = Label.new()
	status_text.text = "DESPERTANDO A MEMORIA DA MATA..."
	status_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_text.add_theme_font_size_override("font_size", 17)
	status_text.add_theme_color_override("font_color", Color("e7d8b3"))
	layout.add_child(status_text)

	bar = ProgressBar.new()
	bar.custom_minimum_size.y = 13
	bar.show_percentage = false
	bar.min_value = 0
	bar.max_value = 100
	bar.value = 0
	layout.add_child(bar)

	var note := Label.new()
	note.text = "A MEMORIA NAO MORRE. ELA DESPERTA."
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	note.add_theme_font_size_override("font_size", 13)
	note.add_theme_color_override("font_color", Color("93c9c0"))
	layout.add_child(note)

func _begin_loading() -> void:
	if ResourceLoader.exists(INTRO_VIDEO):
		var video_resource := ResourceLoader.load(INTRO_VIDEO)
		if video_resource is VideoStream:
			clip.stream = video_resource
			clip.play()
	load_requested = ResourceLoader.load_threaded_request(GAME_SCENE) == OK
	if not load_requested:
		status_text.text = "FALHA AO CARREGAR O MUNDO"

func _process(delta: float) -> void:
	if not load_requested or scene_transition_started:
		return
	var status_progress := []
	var status := ResourceLoader.load_threaded_get_status(GAME_SCENE, status_progress)
	if status_progress.size() > 0:
		progress_value = maxf(progress_value, float(status_progress[0]) * 100.0)
		bar.value = progress_value
	if status == ResourceLoader.THREAD_LOAD_FAILED or status == ResourceLoader.THREAD_LOAD_INVALID_RESOURCE:
		load_requested = false
		status_text.text = "NAO FOI POSSIVEL ABRIR O JOGO"
	elif status == ResourceLoader.THREAD_LOAD_LOADED and Time.get_ticks_msec() - started_ms >= MIN_SHOW_MS:
		scene_transition_started = true
		bar.value = 100
		status_text.text = "A FLORESTA DESPERTA"
		var packed := ResourceLoader.load_threaded_get(GAME_SCENE) as PackedScene
		if packed != null:
			get_tree().call_deferred("change_scene_to_packed", packed)
		else:
			load_requested = false
			scene_transition_started = false
			status_text.text = "ERRO AO PREPARAR O JOGO"

func _on_clip_finished() -> void:
	if is_instance_valid(clip) and clip.stream != null and not scene_transition_started:
		clip.play()
