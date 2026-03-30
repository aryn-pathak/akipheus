let db;
async function init(){
    console.log("Akigator initializing, please wait!");
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });

    const response = await fetch("humans.db")
    const buffer = await response.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buffer));
    console.log("welcome to Akigator!");
}

// obj is an object expected to be in format { citizenshipLabel : ["india", "NOT united states"], occupationLabel : ["actor", "NOT scientist"] ...}
// anything with NOT is something answered "no" to.

let query
export function getAll(obj) {
    query = "SELECT * FROM humansFlat WHERE sitelinks > 1"
    for (let key in obj) {
        for (let filter in obj[key]) {
            if (filter.startsWith("NOT "))
                query += `AND ${key} NOT LIKE '%,${filter},%'`;
            else query += `AND ${key} LIKE '%,${filter},%'`;
        }
    }
    result = db.exec(query)
    return result
}