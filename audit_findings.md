# Page Builder Block Audit Findings

## JE Hero Blocks

### JE Hero Image
**Status:** Testing in progress

**Settings Panel Fields Found:**
- Image Url (Media) - ✅ Has input field + Media Library button
- Title - ✅ Editable text input
- Title Color - ✅ Color picker + text input
- Subtitle - ✅ Editable text input
- Subtitle Color - ✅ Color picker
- Description - ✅ Editable text area
- Description Color - ✅ Color picker
- CTA Text - ✅ Editable text input
- CTA Text Color - ✅ Color picker
- CTA Link - ✅ URL input

**Canvas Rendering:** ✅ Block renders correctly in canvas

**Issues Found:**
(Will be populated during testing)


## JE Content Blocks

### JE Three Pillars
**Status:** ❌ FAIL

**Issue:** Individual pillar content (titles, descriptions, icons) is NOT editable. The block shows 3 pillars but only has settings for:
- Label
- Title (main title)
- Description (main description)
- Image Url

**Missing Settings:**
- Pillar 1: title, description, icon
- Pillar 2: title, description, icon
- Pillar 3: title, description, icon

**Fix Required:** Add editable fields for each pillar's title, description, and icon selection.


### JE Foundational Principles
**Status:** ❌ FAIL

**Issue:** Individual principle content is NOT editable. The block shows numbered principles but only has a Title setting.

**Missing Settings:**
- Principle 1: title, description
- Principle 2: title, description
- Principle 3+: title, description
- Ability to add/remove principles

**Fix Required:** Add editable fields for each principle's title and description, plus ability to add/remove principles.


### JE Volumes Display
**Status:** ❌ FAIL

**Issue:** Individual volume content is NOT editable. The block shows 3 volumes but only has Title and Subtitle settings.

**Missing Settings:**
- Volume 1: title, description, image
- Volume 2: title, description, image
- Volume 3: title, description, image
- Ability to add/remove volumes

**Fix Required:** Add editable fields for each volume's title, description, and image.

### JE Community Section
**Status:** ✅ PASS

**Settings Available:**
- Background Type (video/image)
- Background Url with Media Library
- Overlay Opacity
- Label, Title, Description
- CTA Text, CTA Link
- Image Url with Media Library

All fields are editable and block renders correctly.


### JE FAQ Accordion
**Status:** ❌ FAIL

**Issue:** Individual FAQ items are NOT editable. The block shows FAQ questions but only has Title, Subtitle, Style, and Allow Multiple settings.

**Missing Settings:**
- FAQ Item 1: question, answer
- FAQ Item 2: question, answer
- FAQ Item 3+: question, answer
- Ability to add/remove FAQ items

**Fix Required:** Add editable fields for each FAQ item's question and answer, plus ability to add/remove items.


### JE Footer
**Status:** ⚠️ PARTIAL PASS

**Settings Available:**
- Logo
- Tagline
- Copyright
- Show Newsletter toggle

**Missing Settings:**
- Navigation links (footer shows links but they're not editable)
- Social media links

**Note:** Basic settings are editable but navigation links appear hardcoded.



## JE Media Blocks

### JE Image
**Status:** ✅ PASS

**Settings Available:**
- Image Url with Media Library
- Alt text
- Caption
- Width
- Align (dropdown)
- Rounded (toggle)
- Shadow
- Reveal Animation (toggle)

All fields are editable and block renders correctly.


### JE Video
**Status:** ✅ PASS

**Settings Available:**
- Video Url with Media Library
- Poster Image with Media Library
- Autoplay (toggle)
- Loop (toggle)
- Muted (toggle)
- Controls (toggle)
- Width
- Aspect Ratio

All fields are editable and block renders correctly.


### JE Image Gallery
**Status:** ❌ FAIL

**Issue:** No image upload fields for gallery items. The gallery shows 6 placeholder boxes but there's no way to add individual images.

**Settings Available:**
- Layout (grid)
- Columns (3)
- Gap (medium)
- Lightbox (toggle)

**Missing Settings:**
- Image 1: url, alt, caption
- Image 2: url, alt, caption
- Image 3+: url, alt, caption
- Ability to add/remove gallery items

**Fix Required:** Add image URL fields for each gallery item (or a way to add/remove gallery items dynamically).


### JE Carousel
**Status:** ❌ FAIL

**Issue:** Individual carousel card content is NOT editable. The carousel shows 5 cards but there's no way to edit card titles, descriptions, images, or links.

**Settings Available:**
- Autoplay (toggle)
- Interval (5000)
- Show Dots (toggle)
- Show Arrows (toggle)
- Transition (fade)

**Missing Settings:**
- Card 1: title, description, image, link
- Card 2: title, description, image, link
- Card 3+: title, description, image, link
- Ability to add/remove cards

**Fix Required:** Add editable fields for each carousel card's title, description, image, and link, plus ability to add/remove cards.



## JE Interactive Blocks

### JE Button
**Status:** ✅ PASS

**Settings Available:**
- Text (textarea)
- Link (URL input)
- Size (dropdown)
- Full Width (toggle)

All fields are editable and block renders correctly.


### JE Testimonial
**Status:** ✅ PASS

**Settings Available:**
- Quote (textarea)
- Author
- Role
- Image Url with Media Library
- Style (dropdown)

All fields are editable and block renders correctly.


### JE Offerings Grid
**Status:** ❌ FAIL

**Issue:** Individual offering cards are NOT editable. The grid shows multiple offering cards but only has header settings.

**Settings Available:**
- Title ("Our Offerings")
- Subtitle ("PATHWAYS TO TRANSFORMATION")
- Columns (3)
- Show Prices (toggle)

**Missing Settings:**
- Offering 1: title, description, image, price, link
- Offering 2: title, description, image, price, link
- Offering 3+: title, description, image, price, link
- Ability to add/remove offerings

**Fix Required:** Add editable fields for each offering card's title, description, image, price, and link, plus ability to add/remove offerings.

