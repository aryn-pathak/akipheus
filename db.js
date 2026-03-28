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

// dict is a list expected to be in format [{"sex" : "male"}, {"citizenship" : "NOT india, NOT united states, NOT canada, france, italy"}, {"occupation" : "NOT politician, NOT scientist, actor"}]
// anything with NOT is something answered "no" to.

// export function getAll(dict){
//     const sex = dict.sex
//     const
//
//     return results;
// }

init().then(()=>{console.log(getAll("nigger"))})