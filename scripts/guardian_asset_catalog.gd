extends RefCounted
## Catalogo dos cinco personagens previstos para a v0.2.0.
## O catalogo descreve assets futuros; ele NAO afirma que os GLBs existem.

const ROOT := "res://assets/guardians/"
const SPECS := {
	"espirito_da_mata": {
		"display_name": "Espírito da Mata",
		"role": "guardiao_natural",
		"rig": "humanoid",
		"height_m": 2.5,
		"max_triangles": 18000,
		"max_texture_px": 2048,
		"clips": ["Idle", "Walk", "Run", "Attack", "Hurt", "Death"]
	},
	"bruto_do_exilio": {
		"display_name": "Bruto do Exílio",
		"role": "forca_corrompida",
		"rig": "humanoid",
		"height_m": 2.7,
		"max_triangles": 20000,
		"max_texture_px": 2048,
		"clips": ["Idle", "Walk", "Run", "Attack", "Hurt", "Death"]
	},
	"serpente_de_fogo": {
		"display_name": "Serpente de Fogo",
		"role": "avatar_da_entropia",
		"rig": "segmented_serpent",
		"height_m": 3.0,
		"max_triangles": 16000,
		"max_texture_px": 2048,
		"clips": ["Idle", "Move", "Bite", "Fire", "Hurt", "Death"]
	},
	"ceifador": {
		"display_name": "O Ceifador",
		"role": "sombra_da_memoria",
		"rig": "humanoid",
		"height_m": 2.3,
		"max_triangles": 18000,
		"max_texture_px": 2048,
		"clips": ["Idle", "Walk", "Attack", "Cast", "Hurt", "Death"]
	},
	"guardiao_reptil": {
		"display_name": "Guardião Réptil",
		"role": "sentinela_ancestral",
		"rig": "humanoid_with_tail",
		"height_m": 2.2,
		"max_triangles": 20000,
		"max_texture_px": 2048,
		"clips": ["Idle", "Walk", "Run", "Attack", "Hurt", "Death"]
	}
}

static func ids() -> Array[String]:
	var result: Array[String] = []
	for character_id in SPECS.keys():
		result.append(String(character_id))
	result.sort()
	return result

static func spec(character_id: String) -> Dictionary:
	if not SPECS.has(character_id):
		return {}
	return (SPECS[character_id] as Dictionary).duplicate(true)

static func path_for(character_id: String) -> String:
	if not SPECS.has(character_id):
		return ""
	return ROOT + character_id + ".glb"

static func load_available() -> Dictionary:
	var available: Dictionary = {}
	for character_id in ids():
		var path: String = path_for(character_id)
		if not ResourceLoader.exists(path):
			continue
		var resource = ResourceLoader.load(path)
		if resource is PackedScene:
			available[character_id] = resource
	return available

static func missing_ids() -> Array[String]:
	var missing: Array[String] = []
	for character_id in ids():
		if not ResourceLoader.exists(path_for(character_id)):
			missing.append(character_id)
	return missing
