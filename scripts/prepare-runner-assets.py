"""Prepare licensed runtime assets; retain source art and author licences unchanged."""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / '.studio/game-runner/resources'
OUT = ROOT / 'public/minigame/runner'
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'images').mkdir(exist_ok=True)
(OUT / 'licenses').mkdir(exist_ok=True)
manifest = {'date': '2026-10-04', 'sprites': {}, 'animations': {}, 'sources': [], 'panoramas': []}

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def copy_sprite(key, source, output, frames=1, size=None, crop=None):
    dest = OUT / 'images' / output
    shutil.copy2(source, dest)
    image = Image.open(source)
    manifest['sprites'][key] = 'images/' + output
    if size or crop:
        if size: assert image.width == size * frames and image.height == size, (source, image.size)
        manifest['animations'][key] = {'frameWidth': size or image.width // frames, 'frameHeight': size or image.height, 'frames': frames}
        if crop: manifest['animations'][key]['crop'] = dict(zip(['x', 'y', 'width', 'height'], crop))

frog = SOURCE / 'pixel-adventure/pack2/Free'
hero = frog / 'Main Characters/Virtual Guy'
for name, count in [('Run', 12), ('Idle', 11), ('Jump', 1), ('Fall', 1), ('Hit', 7)]:
    copy_sprite('pixel_' + name.lower(), hero / f'{name} (32x32).png', 'hero-' + name.lower() + '.png', count, 32)
for key, path, frames, size in [
    ('pixel_bat', 'Enemies/Bat/Flying (46x30).png', 7, None),
    ('pixel_saw', 'Traps/Saw/On (38x38).png', 8, 38),
    ('pixel_spikes', 'Traps/Spikes/Idle.png', 1, None),
    ('pixel_crate', 'Items/Boxes/Box1/Idle.png', 1, None),
    ('pixel_boss', 'Traps/Rock Head/Idle.png', 1, 42),
    ('pixel_boss_blink', 'Traps/Rock Head/Blink (42x42).png', 4, 42),
]:
    source = frog / path
    if source.exists():
        crop = {'pixel_spikes': (0, 9, 15, 7), 'pixel_crate': (4, 2, 20, 20), 'pixel_boss': (5, 5, 32, 32), 'pixel_boss_blink': (5, 5, 32, 32)}.get(key)
        copy_sprite(key, source, key + '.png', frames, size, crop)
        if key == 'pixel_bat':
            manifest['animations'][key] = {'frameWidth': 46, 'frameHeight': 30, 'frames': Image.open(source).width // 46}
for pack, key in [('pixel-platformer', 'pixel_tiles'), ('pixel-platformer-farm-expansion', 'pixel_farm'), ('pixel-platformer-industrial-expansion', 'pixel_industry')]:
    source = SOURCE / pack
    copy_sprite(key, source / 'Tilemap/tilemap_packed.png', key + '.png')
    shutil.copy2(source / 'License.txt', OUT / 'licenses' / (pack + '.txt'))
    archive = SOURCE / (pack + '.zip')
    manifest['sources'].append({'author': 'Kenney', 'pack': pack, 'url': 'https://kenney.nl/assets/' + pack, 'license': 'CC0', 'archiveSha256': digest(archive)})
shutil.copy2(SOURCE / 'pixel-adventure/AUTHOR-LICENSE.txt', OUT / 'licenses/pixel-frog.txt')
manifest['sources'].append({'author': 'Pixel Frog', 'url': 'https://pixelfrog-assets.itch.io/pixel-adventure-1', 'license': 'CC0', 'archiveSha256': digest(SOURCE / 'pixel-adventure/Pixel Adventure 1.zip')})

prompts = json.loads((ROOT / '.studio/game-runner/prompts.json').read_text(encoding='utf-8-sig'))
originals = ROOT / '.studio/game-runner/originals'
originals.mkdir(exist_ok=True)
for stage, item in enumerate(prompts['images']):
    source = Path(item['sourcePath'])
    retained = originals / (item['id'] + '.png')
    if not retained.exists(): shutil.copy2(source, retained)
    image = Image.open(retained).convert('RGB')
    image.thumbnail((1280, 720), Image.Resampling.NEAREST)
    dest = OUT / 'images' / ('stage-' + str(stage + 1) + '.webp')
    image.save(dest, 'WEBP', quality=91, method=6)
    manifest['sprites']['pixel_background_' + str(stage)] = 'images/' + dest.name
    manifest['panoramas'].append({'stage': stage, 'name': item['id'], 'sourceSha256': digest(retained), 'nativeSize': Image.open(retained).size, 'runtimeSize': image.size, 'bytes': dest.stat().st_size, 'path': 'images/' + dest.name, 'provenance': 'Original built-in imagegen, prompts retained'})
manifest['files'] = [{'path': str(p.relative_to(OUT)).replace('\\', '/'), 'bytes': p.stat().st_size, 'sha256': digest(p)} for p in sorted((OUT / 'images').glob('*'))]
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print(f"Prepared {len(manifest['sprites'])} runtime images, {sum(x['bytes'] for x in manifest['files'])} bytes")

# Labelled inspection contact sheets; not shipped and not transformed source art.
for pack in ['pixel-platformer', 'pixel-platformer-farm-expansion', 'pixel-platformer-industrial-expansion']:
    sheet = Image.open(SOURCE / pack / 'Tilemap/tilemap_packed.png').convert('RGBA')
    columns, rows = sheet.width // 18, sheet.height // 18
    preview = Image.new('RGB', (columns * 62, rows * 76), '#f3e8d0')
    draw = ImageDraw.Draw(preview)
    for y in range(rows):
        for x in range(columns):
            tile = sheet.crop((x * 18, y * 18, x * 18 + 18, y * 18 + 18)).resize((54, 54), Image.Resampling.NEAREST)
            preview.paste(tile, (x * 62 + 4, y * 76), tile)
            draw.text((x * 62 + 4, y * 76 + 56), f'{x},{y}', fill='#171512')
    preview.save(ROOT / '.studio/game-runner' / (pack + '-inspection.png'))
