# Profile Image Setup

## Adding Your Profile Picture

To add your profile picture to the Founder page:

1. Download your profile picture from LinkedIn or any other source
2. Save it as `profile-picture.jpg` in this `public` folder
3. The image will automatically appear on the Founder page

## Image Requirements

- **Recommended format**: JPG or PNG
- **Recommended size**: 200x200 pixels or larger (square)
- **File name**: `profile-picture.jpg` (or update the path in `src/pages/FounderPage.tsx`)

## Current Status

The LinkedIn image URL provided:
```
https://media.licdn.com/dms/image/v2/D5603AQFkh9VOJnGnPw/profile-displayphoto-shrink_200_200/B56ZxXbxqKG4AY-/0/1770993426014?e=1772668800&v=beta&t=wiPCC-WnwR8msRE5UMqcxoZLL3ILK44IWLErFPhbsMo
```

**Note**: Due to network restrictions in the development environment, the image needs to be manually downloaded and added to this folder.

## Fallback Behavior

If the image file is not found or fails to load, the page will display the initials "AG" as a fallback.
