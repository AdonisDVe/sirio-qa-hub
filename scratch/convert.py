import base64
from PIL import Image
import io

def convert_png():
    with open('scratch/test.png', 'rb') as f:
        img = Image.open(f)
        # convert 8-bit to RGBA
        img = img.convert('RGBA')
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        return base64.b64encode(buf.getvalue()).decode('utf-8')

def convert_jpeg():
    with open('scratch/test.jpeg', 'rb') as f:
        img = Image.open(f)
        # convert to standard RGB
        img = img.convert('RGB')
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=95, optimize=False, progressive=False)
        return base64.b64encode(buf.getvalue()).decode('utf-8')

new_png_b64 = convert_png()
new_jpeg_b64 = convert_jpeg()

ts_content = f"""export const logoNovumideasBase64 = "{new_png_b64}";
export const logoClienteBase64 = "{new_jpeg_b64}";
"""

with open('./src/utils/logosBase64.ts', 'w') as f:
    f.write(ts_content)

print("Converted and saved logosBase64.ts")
