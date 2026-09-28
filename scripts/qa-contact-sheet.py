from pathlib import Path
from PIL import Image, ImageDraw
root=Path('.studio/qa/rebuild')
for mode in ['desktop','mobile']:
    files=[root/'00-hero.png'] if mode=='desktop' else [root/'00-mobile.png']
    files += [root/f'{i:02}-{mode}.png' for i in range(1,9)]
    if not all(p.exists() for p in files): continue
    w,h=(480,300) if mode=='desktop' else (260,563)
    sheet=Image.new('RGB',(w*3,(h+26)*3),'#131719');draw=ImageDraw.Draw(sheet)
    for i,p in enumerate(files):
        x=(i%3)*w;y=(i//3)*(h+26)
        im=Image.open(p).convert('RGB');im.thumbnail((w,h))
        sheet.paste(im,(x,y+26));draw.text((x+10,y+7),f'{i:02} / {mode.upper()}',fill='#efe9dc')
    sheet.save(root/f'contact-{mode}.jpg',quality=92)
    print(root/f'contact-{mode}.jpg')
