const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  const oldSections = [
    "commitment", "conformance", "introduction", "informationCollect", 
    "howWeUse", "dataSharing", "dataSecurity", "cookies", "yourRights", 
    "childrenPrivacy", "changes", "contact", "acceptance", "useOfService", 
    "userAccounts", "intellectualProperty", "userContent", "prohibitedUses", 
    "disclaimer", "limitation", "indemnification", "termination", "governing", 
    "whatAreCookies", "typesOfCookies", "thirdParty", "managing", "yourChoices"
  ];
  
  const pages = ["accessibility", "privacy-policy", "terms-of-service", "cookie-policy"];
  
  for (const page of pages) {
    const placeholders = oldSections.map(() => "?").join(",");
    const [result] = await conn.execute(
      `DELETE FROM pageContent WHERE page = ? AND section IN (${placeholders})`, 
      [page, ...oldSections]
    );
    console.log(`${page}: deleted ${result.affectedRows} rows`);
  }
  
  await conn.end();
  console.log("Done!");
})();
