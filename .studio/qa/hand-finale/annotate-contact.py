from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

folder = Path(__file__).parent
image = Image.open(folder / 'desktop-1920.png').convert('RGB')
print('Screenshot size:', image.size)
draw = ImageDraw.Draw(image)
color = '#FF9F1C'
font = ImageFont.truetype('C:/Windows/Fonts/Inkfree.ttf', 42)
# Captured image-space contact, inspected in the full screenshot.
draw.rounded_rectangle((918, 348, 977, 408), radius=14, outline=color, width=5)
draw.line((977, 348, 1006, 321), fill=color, width=5)
draw.text((1011, 284), 'Touch', font=font, fill=color, stroke_width=1, stroke_fill=color)
image.save(folder / 'contact-annotated.png')
