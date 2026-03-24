async function init(){
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });
    const response = await fetch("humans.db")
    const buffer = await response.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(buffer));
}
init();

const results = db.exec("SELECT * FROM humansFlat LIMIT 10");
console.log(results);