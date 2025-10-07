# Card Back Image Setup Instructions

## Step 1: Prepare Your Image

You have a blue icon image with a transparent background. To use it as the card back:

1. **Save the image** as `card-back-icon.png`
2. The image should be:
   - PNG format with transparent background
   - Square aspect ratio (e.g., 512x512px or 1024x1024px)
   - Blue icon/logo design
   - High quality for crisp display

## Step 2: Place the Image

Put the `card-back-icon.png` file in the public folder:

```
Poker/
  web/
    public/
      card-back-icon.png  <-- Put your image here
    src/
    ...
```

## Step 3: Alternative: Use Base64 Encoded Image

If you prefer to embed the image directly in the code:

1. Convert your PNG to base64 at: https://www.base64-image.de/
2. Replace the image src in `Card.tsx`:

```tsx
<img 
  src="data:image/png;base64,YOUR_BASE64_STRING_HERE" 
  alt="Card back" 
  className="w-3/4 h-3/4 object-contain"
/>
```

## Step 4: Test the Card Back

After placing the image, refresh your browser. You should see:
- Your blue icon on the back of all face-down cards
- Smooth flip animations when cards are revealed
- Animated dealing from the center of the table

## Image Specifications

- **Format**: PNG with transparency
- **Size**: 512x512px or larger (will be scaled down)
- **Colors**: Blue tones that match the poker theme
- **Style**: Clean, geometric design works best
- **Background**: Transparent (alpha channel)

## Fallback

If the image fails to load, the card back will show a geometric pattern with concentric circles.

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Verify file path: `/card-back-icon.png`
3. Ensure image format is PNG
4. Try clearing browser cache (Ctrl+F5)
