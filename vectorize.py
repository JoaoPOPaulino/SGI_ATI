import cv2
import numpy as np
import base64

img = cv2.imread('ati logo.png', cv2.IMREAD_UNCHANGED)
if img is None:
    print('Failed to load image')
    exit()

# If it has an alpha channel, use it, else convert to grayscale
if len(img.shape) == 3 and img.shape[2] == 4:
    # Use alpha channel directly
    mask = img[:,:,3]
else:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # The background is white-ish, text is dark
    _, mask = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY_INV)

# Find contours
contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_TC89_L1)

svg_path = ""
for contour in contours:
    # Approximate contour to reduce points
    epsilon = 0.002 * cv2.arcLength(contour, True)
    approx = cv2.approxPolyDP(contour, epsilon, True)
    
    if len(approx) > 2:
        path = "M " + " L ".join([f"{pt[0][0]:.1f},{pt[0][1]:.1f}" for pt in approx]) + " Z "
        svg_path += path

width, height = img.shape[1], img.shape[0]

svg_content = f'''<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
  <path d="{svg_path}" fill="currentColor" />
</svg>'''

with open("ati_logo_vector.svg", "w") as f:
    f.write(svg_content)

print(f"Generated SVG with {len(contours)} paths.")
