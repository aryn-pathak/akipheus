async function init(){
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });
    console.log("sql.js loaded");
    const response = await fetch("https://cdn.hackclub.com/019d1ee8-269e-7b41-b6f6-09406c7fbb9d/humans.db");
    const buffer = await response.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(buffer));

    const results = db.exec("SELECT * FROM your_table LIMIT 10");
    console.log(results);
}