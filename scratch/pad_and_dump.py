import base64
from PIL import Image
import io

def convert_png():
    with open('scratch/test.png', 'rb') as f:
        img = Image.open(f)
        img = img.convert('RGBA')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return base64.b64encode(buf.getvalue()).decode('utf-8')

def pad_base64(b64):
    missing_padding = len(b64) % 4
    if missing_padding:
        b64 += '=' * (4 - missing_padding)
    return b64

with open('scratch/test.png.b64', 'w') as f:
    pass

import sys
try:
    with open('./src/utils/logosBase64.ts', 'r') as f:
        content = f.read()
    import re
    m1 = re.search(r'export const logoNovumideasBase64 = "(.*?)";', content)
    raw1 = m1.group(1).replace('data:image/png;base64,', '')
    raw1 = re.sub(r'\s+', '', raw1)
    raw1 = pad_base64(raw1)
    with open('scratch/test.png', 'wb') as f:
        f.write(base64.b64decode(raw1))
    
    m2 = re.search(r'export const logoClienteBase64 = "(.*?)";', content)
    raw2 = m2.group(1).replace('data:image/jpeg;base64,', '').replace('data:image/png;base64,', '')
    raw2 = re.sub(r'\s+', '', raw2)
    raw2 = pad_base64(raw2)
    with open('scratch/test.jpeg', 'wb') as f:
        f.write(base64.b64decode(raw2))
except Exception as e:
    print("Error:", e)
