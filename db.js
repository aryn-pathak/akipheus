let db
export let obj = {"citizenshipLabel":[], "sexLabel":[], "occupationLabel":[], "special":[], "politicalParty":[], "employer":[], "alive":[], "field":[]};
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
import nlp from 'https://esm.sh/compromise';

function match(name) {
    let item = getAll(obj)[0].values.find(o => o[0] === name);
    if (!item) return 0;
    let totalNo = 0;
    let no = 0;

    for (const property of Object.keys(obj)) {
        let array = item[indices[property]];
        totalNo += array.filter(o => obj[property].includes(o)).length;
        no += obj[property].length;
    }
    if (no === 0) return 0;
    return totalNo / no;
}

nlp.addWords({
    'prime minister':    'Title',
    'vice president':    'Title',
    'attorney general':  'Title',
    'foreign minister':  'Title',
    'crown prince':      'Title',
    'field marshal':     'Title',
    'managing director': 'Title',
    'venture capitalist':'Title',
    'chief rabbi':       'Title',
    'dalai lama':        'Title',
    'chief minister':    'Title',
    'finance minister':  'Title',
    'defence minister':  'Title',
    'co-founder':    'Title',
    'chief executive officer':  'Title',
    'racing driver': 'Title',
    'soccer player': 'Title',
    'association football player': 'Title',
})

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
            if (filter.startsWith("NOT "))
                query += ` AND ${key} NOT LIKE '%"${filter.slice(4)}"%'`;
            else query += ` AND ${key} LIKE '%"${filter}"%'`;
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

export function getDesc(descList){
    let QList = []
    let PList = []

    for (const person of descList){
        let desc = nlp(person.desc)
        desc.match('#Demonym').remove()

        let nouns = desc.nouns().out('array').filter(phrase => {
            let words = phrase.split(' ');
            return !words.some(word =>
                obj.occupationLabel.includes(word) ||
                obj.occupationLabel.includes(`NOT ${word}`)
            );
        })

        let organisations = desc.organizations().out('array').filter(phrase => {
            let words = phrase.split(' ');
            return !words.some(word =>
                obj.employer.includes(word) ||
                obj.employer.includes(`NOT ${word}`)
            );
        })

        console.log(person.person, { nouns, organisations, sitelinks: person.sitelinks })

        let entry = { name: person.person, indices: [], yes: 0, match: match(person.person), sitelinks: person.sitelinks ?? 0 }

        for (const noun of nouns){
            let q = `is your character a ${noun}?`
            if (!QList.includes(q)){
                QList.push(q)
            }
            let index = QList.indexOf(q)
            if (!entry.indices.includes(index)) entry.indices.push(index)
        }

        for (const org of organisations){
            let q = `is your character associated with ${org}?`
            if (!QList.includes(q)){
                QList.push(q)
            }
            let index = QList.indexOf(q)
            if (!entry.indices.includes(index)) entry.indices.push(index)
        }

        PList.push(entry)
    }

    for (const person of descList){
        if (!person.occupations) continue
        let entry = PList.find(p => p.name === person.person)
        if (!entry) continue
        for (let i = 0; i < QList.length; i++){
            let phrase = QList[i].replace("is your character a ", "").replace("?", "")
            if (person.occupations.includes(phrase)){
                if (!entry.indices.includes(i)){
                    entry.indices.push(i)
                }
            }
        }
    }

    return { QList, PList }
}