from PIL import Image, ImageDraw
import os

os.makedirs('static/images', exist_ok=True)

images = [
    ('disease-prevention.jpg', (46, 204, 113)),
    ('organic-control.jpg', (39, 174, 96)),
    ('early-detection.jpg', (52, 152, 219)),
    ('video-thumb1.jpg', (231, 76, 60)),
    ('video-thumb2.jpg', (243, 156, 18)),
    ('video-thumb3.jpg', (155, 89, 182)),
]

for filename, color in images:
    img = Image.new('RGB', (400, 300), color)
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 100, 350, 200], fill=(255, 255, 255))
    img.save(f'static/images/{filename}')
    print(f'Created: {filename}')

print('Done!')
