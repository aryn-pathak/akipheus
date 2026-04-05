let db;
async function init(){
    console.log("initializing");
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });

    const response = await fetch("humans.db")
    const buffer = await response.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buffer));
    console.log("initialised");
}

// obj is an object expected to be in format { citizenshipLabel : ["India", "NOT United States"], occupationLabel : ["actor", "NOT scientist"] ...}
// anything with NOT is something answered "no" to.

export function getAll(obj) {
    let query = "SELECT * FROM humansFlat WHERE sitelinks > 1"
    for (let key in obj) {
        for (let filter of obj[key]) {
            if (filter.startsWith("NOT "))
                query += ` AND ${key} NOT LIKE '%"${filter.slice(4)}"%'`;
            else query += ` AND ${key} LIKE '%"${filter}"%'`;
        }
    }
    let result = db.exec(query);
    console.log(result);

    let rows = result[0].values

    for (const item of rows) {
        item[3] = item[3] ? JSON.parse(item[3]) : [];
        item[4] = item[4] ? JSON.parse(item[4]) : [];
    }
    return result;
}