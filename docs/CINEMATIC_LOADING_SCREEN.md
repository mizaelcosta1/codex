# Tela de carregamento Ratanaba Guardians v0.2

The game boots through `res://scenes/loading.tscn` (no change to original game scene). A full-bleed VideoStreamPlayer optionally displays `res://assets/video/ratanaba_loading.ogv`, with translucent scrim, golden cinematic title, teal subtitle and a real progress bar. On missing/unreadable video, loading still works over a dark fallback.

Video requirements:
- 16:9, 480p or higher, 24/30 fps; loopable, no embedded loading percentage.
- Import as Ogg Theora `.ogv` with ffmpeg for Godot 4.6.3's VideoStreamPlayer. MP4/H.264 is not guaranteed as a built-in Godot runtime video codec.
- Keep at or below approximately 8 MB for Android startup, preferably 4-6 seconds.
- A static image source is never a substitute for a completed video.
- For cinematic Genjutsu output, keep the original generated MP4, job ID, source reference, provider and license details in this doc once known.
- UI is localizable and its progress depends on ResourceLoader threaded load status.
- Preserve the game's existing settings, menu and gameplay scenes.
- Test in Godot headless and Android physical device. Loading may be faster than the 1.8-second minimum on modern phones.

The actual video is published separately after the generation is complete and its bytes are verified. Do not claim cinematic output embedded in an APK until the video artifact and APK build are both verified.
