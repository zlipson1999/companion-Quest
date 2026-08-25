"""Render the documentation preview for the compact in-gym cardio overlay.

The room comes from the checked-in 390x844 runtime capture. Player poses come
from the same generated sprite registry the app uses. The console is a static
layout preview; it is not presented as a device screenshot.
"""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PREVIEWS = ROOT / 'docs' / 'previews'
FONT_PATH = ROOT / 'node_modules' / '@expo-google-fonts' / 'press-start-2p' / 'PressStart2P_400Regular.ttf'

spec = spec_from_file_location('make_sprites', ROOT / 'tools' / 'make_sprites.py')
sprites = module_from_spec(spec)
spec.loader.exec_module(sprites)


def font(size):
    return ImageFont.truetype(str(FONT_PATH), size)


def sprite_image(name, height):
    sprite = sprites.SPRITES[name]
    grid = sprite['grid']
    palette = sprites.PALETTES[sprite['palette']]
    raw = Image.new('RGBA', (len(grid[0]), len(grid)), (0, 0, 0, 0))
    px = raw.load()
    for y, row in enumerate(grid):
        for x, code in enumerate(row):
            if code == sprites.TRANSPARENT:
                continue
            color = palette[sprites.DIGITS.find(code)]
            px[x, y] = (*sprites.hex_to_rgb(color), 255)
    width = round(raw.width * height / raw.height)
    return raw.resize((width, height), Image.Resampling.NEAREST)


def clear_old_party(image):
    # The source capture has the player and companion near the mats. Replace
    # those small rectangles with adjacent floor from the same zones before
    # positioning the live cardio pose on the east-wall machine.
    image.paste(image.crop((270, 365, 310, 450)), (225, 365))
    image.paste(image.crop((238, 410, 274, 468)), (178, 410))


def text(draw, xy, value, size=7, color='#fff4d6'):
    draw.text(xy, value, font=font(size), fill=color)


def button(draw, box, label):
    x0, y0, x1, y1 = box
    draw.rectangle((x0 + 3, y0 + 3, x1 + 3, y1 + 3), fill='#171923')
    draw.rectangle(box, fill='#276451', outline='#91bd69', width=2)
    bbox = draw.textbbox((0, 0), label, font=font(7))
    text(draw, (x0 + (x1 - x0 - (bbox[2] - bbox[0])) / 2, y0 + 15), label, 7)


def console(draw, station):
    bike = station == 'bike'
    x0, y0, x1, y1 = 10, 548, 296, 746
    draw.rounded_rectangle((x0, y0, x1, y1), radius=6, fill='#101219ee', outline='#454858', width=3)
    text(draw, (20, 560), 'BIKE RIDE' if bike else 'TREADMILL', 7, '#c2a982')
    text(draw, (222, 560), 'RIDING' if bike else 'MOVING', 7, '#91bd69')

    text(draw, (46, 585), 'TIME', 6, '#c2a982')
    text(draw, (31, 600), '08:42', 11, '#91bd69')
    text(draw, (178, 585), 'DISTANCE', 6, '#c2a982')
    text(draw, (182, 600), '2.14', 11, '#91bd69')
    text(draw, (250, 605), 'mi', 6, '#c2a982')

    if bike:
        metrics = [('SPEED', '14.8'), ('KCAL', '112'), ('GPS', 'LIVE')]
    else:
        metrics = [('LAPS', '3.2'), ('PACE', '09:18'), ('KCAL', '143'), ('STEPS', '2,614')]
    cell = 266 / len(metrics)
    for index, (label, value) in enumerate(metrics):
        cx = 20 + index * cell
        text(draw, (cx, 631), label, 5, '#c2a982')
        text(draw, (cx, 643), value, 7)

    boundary = 'Bike cardio only - no trail progress' if bike else 'Gym cardio only - no trail progress'
    text(draw, (20, 667), boundary, 5, '#c2a982')
    text(draw, (20, 679), 'or Trail Credit.', 5, '#c2a982')
    button(draw, (20, 698, 286, 738), 'End Bike Ride' if bike else 'Step off')


def objective(draw, station):
    draw.rectangle((10, 766, 380, 832), fill='#292b38', outline='#454858', width=2)
    draw.rectangle((22, 779, 26, 819), fill='#276451')
    text(draw, (35, 778), 'QUEST FITNESS', 6, '#c2a982')
    line = 'Real GPS movement turns the pedals' if station == 'bike' else 'Real steps move the runner'
    text(draw, (35, 800), line, 6)


def phone(station):
    image = Image.open(PREVIEWS / 'gym-cardio-floor.png').convert('RGBA')
    clear_old_party(image)
    draw = ImageDraw.Draw(image)
    # Replace the old status/control region. The map remains at its full width;
    # the compact fascia belongs to the world band instead of sizing it.
    draw.rectangle((0, 520, 390, 844), fill='#171923')

    pose = sprite_image('hero_woman_left_a' if station == 'bike' else 'hero_woman_up_a', 34 if station == 'bike' else 41)
    tile_x = 338
    tile_y = 59 + (9 if station == 'bike' else 7) * 22
    image.alpha_composite(pose, (tile_x + (22 - pose.width) // 2 - (2 if station == 'bike' else 0), tile_y + 22 - pose.height))

    draw = ImageDraw.Draw(image)
    console(draw, station)
    objective(draw, station)
    return image


left = phone('treadmill')
right = phone('bike')
sheet = Image.new('RGB', (796, 884), '#101219')
sheet.paste(left.convert('RGB'), (4, 36))
sheet.paste(right.convert('RGB'), (402, 36))
draw = ImageDraw.Draw(sheet)
text(draw, (92, 12), 'TREADMILL - LIVE STEPS', 7, '#91bd69')
text(draw, (494, 12), 'BIKE RIDE - LIVE GPS', 7, '#91bd69')

out = PREVIEWS / 'gym-cardio-live-overlay-preview.png'
sheet.save(out)
print(f'wrote {out} ({sheet.width}x{sheet.height})')
