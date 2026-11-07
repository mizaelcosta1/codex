extends SceneTree
## Teste independente: nao depende de gerar modelos ou de iniciar gameplay.

const GuardianCatalog = preload("res://scripts/guardian_asset_catalog.gd")
var failures := 0
var checks := 0

func _initialize() -> void:
	call_deferred("_run")

func _check(condition: bool, description: String) -> void:
	checks += 1
	if condition:
		print("PASS ", description)
	else:
		failures += 1
		push_error("FAIL " + description)

func _run() -> void:
	var ids: Array[String] = GuardianCatalog.ids()
	_check(ids.size() == 5, "cinco personagens catalogados")
	_check(not ids.has("curupira"), "catalogo nao substitui assets atuais")
	_check(GuardianCatalog.path_for("desconhecido") == "", "id desconhecido nao gera caminho")
	for id in ids:
		var definition: Dictionary = GuardianCatalog.spec(id)
		_check(GuardianCatalog.path_for(id) == "res://assets/guardians/" + id + ".glb", "caminho GLB: " + id)
		_check(int(definition.get("max_triangles", 0)) > 0, "orcamento de triangulos: " + id)
		_check((definition.get("clips", []) as Array).size() >= 5, "clips previstos: " + id)
	var available: Dictionary = GuardianCatalog.load_available()
	for id in available.keys():
		_check(ids.has(String(id)), "GLB registrado tem id conhecido")
		_check(available[id] is PackedScene, "GLB importado e PackedScene")
	print("GUARDIAN_CATALOG_RESULT ", checks - failures, "/", checks)
	quit(1 if failures > 0 else 0)
