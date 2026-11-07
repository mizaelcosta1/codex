extends SceneTree
const Loader = preload("res://scripts/loading_screen.gd")
var failures := 0

func _initialize() -> void:
	call_deferred("_run")

func _expect(condition: bool, message: String) -> void:
	if condition:
		print("PASS ", message)
	else:
		failures += 1
		push_error("FAIL " + message)

func _run() -> void:
	_expect(ResourceLoader.exists("res://scenes/loading.tscn"), "Loading scene exists")
	_expect(ResourceLoader.exists("res://scenes/main.tscn"), "Main game scene exists")
	var screen := Loader.new()
	root.add_child(screen)
	_expect(screen.clip != null, "VideoStreamPlayer available")
	_expect(screen.bar != null, "Loading progress available")
	_expect(screen.status_text != null, "Accessible text status")
	_expect(screen.clip.stream == null or screen.clip.stream is VideoStream, "Video optional and correctly typed")
	_expect(ResourceLoader.exists("res://assets/video/ratanaba_loading.ogv"), "Video Genjutsu presente")
	var video: Resource = ResourceLoader.load("res://assets/video/ratanaba_loading.ogv")
	_expect(video is VideoStream, "Video Genjutsu Ogg Theora importado corretamente")
	print("LOADING_SCREEN_RESULT ", 7 - failures, "/7")
	screen.queue_free()
	quit(1 if failures > 0 else 0)
