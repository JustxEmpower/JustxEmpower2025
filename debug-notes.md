# Debug Notes - Home Page Sections Not Showing

## Issue
The Philosophy, Community, and Rooted Unity sections are NOT appearing on the home page even though:
1. The database has the content (verified via SQL query)
2. The Home.tsx is using the correct section type names ('content', 'community', 'rooted-unity')

## Database Content (Verified)
- pageId: 1 (home page)
- Sections exist:
  - id: 60003, sectionType: 'content' (Philosophy) - HAS CONTENT
  - id: 60005, sectionType: 'community' - HAS CONTENT  
  - id: 60006, sectionType: 'rooted-unity' - HAS CONTENT

## Possible Issues
1. The usePageSectionContent hook might not be fetching data correctly
2. The API endpoint might be returning errors (seen tRPC errors in logs)
3. The pageId mapping might be wrong (using pageId=1 but sections have pageId=1)

## Next Steps
1. Check browser console for errors
2. Check if the API is returning the sections correctly
3. Debug the usePageSectionContent hook
