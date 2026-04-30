let db
export let obj = {"citizenshipLabel":[], "sexLabel":[], "occupationLabel":[], "special":[], "politicalParty":[], "employer":[], "alive":[], "field":[], "personDescription":[]};
const indices = {
    'citizenshipLabel':2,
    'sexLabel':3,
    'occupationLabel':4,
    'special':5,
    'politicalParty':6,
    'employer':7,
    'alive':8,
    'sitelinks':10,
    'P':11,
    'field':12
}

const keywords = [
    "prime minister", "foreign minister", "finance minister", "defence minister", "chief minister", "mayor", "vice president", "king", "the Pope", "chief executive officer", "ceo", "founder", "co-founder",
    "chairman", "chairperson", "chairwoman", "president", "minister",
]
export async function init(){
    console.log("initializing");
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });
    const response = await fetch("humansClean.db")
    const buffer = await response.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buffer));
    console.log("initialised");
}

export function getAll(o) {
    let query = "SELECT * FROM humans WHERE sitelinks > 1"
    for (let key of Object.keys(o)) {
        for (let filter of o[key]) {
            if (key === "personDescription") {
                if (filter.startsWith("NOT "))
                    query += ` AND personDescription NOT LIKE '%${filter.slice(4)}%'`
                else query += ` AND personDescription LIKE '%${filter}%'`
            } else {
                if (filter.startsWith("NOT "))
                    query += ` AND ${key} NOT LIKE '%"${filter.slice(4)}"%'`;
                else query += ` AND ${key} LIKE '%"${filter}"%'`;
            }
        }
    }
    let result = db.exec(query);
    if (!result || result.length === 0) return [];

    let rows = result[0].values

    for (const item of rows) {
        item[2] = item[2] ? JSON.parse(item[2]) : [];
        item[3] = item[3] ? JSON.parse(item[3]) : [];
        item[4] = item[4] ? JSON.parse(item[4]) : [];
        item[5] = item[5] ? JSON.parse(item[5]) : [];
        item[6] = item[6] ? JSON.parse(item[6]) : [];
        item[7] = item[7] ? JSON.parse(item[7]) : [];
        item[8] = item[8] ? JSON.parse(item[8]) : [];
        item[12] = item[12] ? JSON.parse(item[12]) : [];
    }
    return result;
}

function bayesian(M, S, R){
    return ((250*M)+(S*R))/(250+S)
}

export function getPopular(property, obj){
    let people = getAll(obj)[0].values
    let raw = []
    people.forEach((item) => {
        let values = item[indices[property]] || []
        for (const value of values) {
            raw.push({"name": value, "P": item[indices.P]})
        }
    })

    let unique = []
    raw.forEach((item) => {
        if (!unique.includes(item.name)) {
            unique.push(item.name)
        }
    })

    let aggregate = []
    for (const item of unique){
        let filtered = raw.filter(o => o.name === item).map(o => o.P);
        let totalP = filtered.reduce((acc, no) => acc + no);
        aggregate.push({
            "name": item,
            "S": filtered.length,
            "R": totalP / filtered.length
        });
    }

    const sortedR = aggregate.map(a => a.R).sort((a, b) => a - b);
    const M = sortedR[Math.floor(sortedR.length / 2)];

    for (const entry of aggregate) {
        entry.B = bayesian(M, entry.S, entry.R);
    }

    aggregate.sort((a, b) => b.B - a.B)

    let result = ""
    for (let i = 0; i < aggregate.length; i++){
        if (obj[property].includes(aggregate[i].name) ||
            obj[property].includes("NOT " + aggregate[i].name)) {
        } else {
            result = aggregate[i].name;
            break;
        }
    }
    return result;
}

export function getTitle(descList) {
    descList.sort((a, b) => (b.sitelinks ?? 0) - (a.sitelinks ?? 0))
    for (const person of descList) {
        let desc = (person.desc || "").toLowerCase()
        for (const k of keywords) {
            if (obj.personDescription.includes(k) || obj.personDescription.includes(`NOT ${k}`)) continue
            let re = new RegExp(`\\b${k}\\b`)
            if (re.test(desc)) return k
        }
    }
    return null
}