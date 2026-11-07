extends RefCounted
## Six independent original Ratanaba cast GLBs. Existing game assets are preserved.
const ROOT := "res://assets/ratanaba/"
const SPECS := {
	"o_banido": {"name":"O Banido","clips":["Idle","Walk","Run","Attack","Dodge","Hurt"]},
	"curupira": {"name":"Curupira","clips":["Idle","Walk","Run","Attack","Dodge","Hurt"]},
	"boto": {"name":"Boto","clips":["Idle","Walk","Run","Attack","Transform","Hurt"]},
	"matinta_pereira": {"name":"Matinta Pereira","clips":["Idle","Walk","Cast","Attack","Dodge","Hurt"]},
	"mula_sem_cabeca": {"name":"Mula Sem Cabeça","clips":["Idle","Trot","Gallop","Charge","Kick","Hurt"]},
	"boitata": {"name":"Boitatá","clips":["Idle","Slither","Bite","Fire","Coil","Hurt"]}
}
static func ids() -> Array[String]:
	var result: Array[String] = []
	for name in SPECS:
		result.append(String(name))
	result.sort()
	return result
static func path_for(id: String) -> String:
	if not SPECS.has(id):
		return ""
	return ROOT + id + ".glb"
static func load_available() -> Dictionary:
	var found: Dictionary = {}
	for id in ids():
		var path: String = path_for(id)
		if not ResourceLoader.exists(path):
			continue
		var resource := load(path)
		if resource is PackedScene:
			found[id] = resource
	return found
