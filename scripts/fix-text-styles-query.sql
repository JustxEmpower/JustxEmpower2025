-- Test query for text styles
SELECT 
  cts.contentId,
  sc.section,
  sc.contentKey,
  cts.isBold,
  cts.isItalic,
  cts.isUnderline,
  cts.fontSize,
  cts.fontColor,
  cts.fontOverride
FROM contentTextStyles cts
INNER JOIN siteContent sc ON cts.contentId = sc.id
WHERE sc.page = 'founder';
