let db
export let obj = {"citizenshipLabel":[], "sexLabel":[], "occupationLabel":[], "special":[], "political party":[], "employer":[], "alive":[], "field":[]};
const indices = {
    'citizenshipLabel':1,
    'sexLabel':2,
    'occupationLabel':3,
    'special':4,
    'political party':5,
    'employer':6,
    'alive':7,
    'P':11,
    'field':12
}

function match(name) {
    let item = getAll(obj)[0].values.find(o => o[0] === name);
    let totalNo = 0;
    let no = 0;

    for (const property of Object.keys(obj)) {
        let array = item[indices[property]];
        totalNo += array.filter(o => obj[property].includes(o)).length;
        no += obj[property].length;
    }
    return totalNo / no;
}

import nlp from 'compromise'
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
}) // list of common multi-word titles

export async function init(){
    console.log("initializing");
    const SQL = await initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
    });

    const response = await fetch("humans.db")
    const buffer = await response.arrayBuffer();
    db = new SQL.Database(new Uint8Array(buffer));
    console.log("initialised");
}

// obj is an object expected to be in format { citizenshipLabel : ["India", "NOT United States"], occupationLabel : ["actor", "NOT scientist"] ...} and anything with NOT is something answered "no" to.

export function getAll(o) {
    let query = "SELECT * FROM humansFlat WHERE sitelinks > 1"
    for (let key of Object.keys(o)) {
        for (let filter of o[key]) {
            if (filter.startsWith("NOT "))
                query += ` AND ${key} NOT LIKE '%"${filter.slice(4)}"%'`;
            else query += ` AND ${key} LIKE '%"${filter}"%'`;
        }
    }
    let result = db.exec(query);
    if (!result || result.length === 0) return [];
    console.log(result);

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
function bayesian(M, S, R){          // M: global P avg, C: weight, S: no of occurrences, R: avg P of particular
    return ((20*M)+(S*R))/(20+S)
}
// getAll() returns columns and values separately, values is an array, not key-value pairs
export function getPopular(property, obj){
    let people = getAll(obj)[0].values
    let index
    let raw = []
    people.forEach((item) => {
        raw.push({"name": item[0], "P": item[indices.P]})
    })

    let unique = []
    raw.forEach((item) => {
        if (unique.includes(item.name)){}else{
            unique.push(item.name)
        }
    })
    const M = raw.reduce((acc, o)=>acc + o.P, 0)/unique.length

    let aggregate = []
    for (const item of unique){
        let filtered = raw.filter(o => o.name === item).map(o => o.P);
        let totalP = filtered.reduce((acc, no)=>acc + no);
        aggregate.push({"name":item, "S":filtered.length, "B":bayesian(M, totalP, (totalP/filtered.length))});
    }
    aggregate.sort((a, b)=>b.B-a.B)

    let result = ""
    for (let i=0; i<aggregate.length; i++){
        if(obj[property].includes(aggregate[i].name) ||
            obj[property].includes("NOT " + aggregate[i].name)){}
        else{result = aggregate[i];
            break;}
    }
    return result;
}

export function getDesc(descList){
    let list = []
    for (const person of descList){
        let desc = person.desc

        let organisation = desc.organisations().out('array')
        let nouns = desc.nouns().out('array').filter(item =>
            !obj.occupationLabel.includes(item) &&
            !obj.occupationLabel.includes(`NOT ${item}`)
        ) // removes occupations already filtered, leaves titles and uncovered occupations
        list.push({'person':person[person], 'organisation':organisation,'nouns':nouns, 'match':match(person.person)})
    }
    list.sort((a, b) => b.match - a.match)
    for(const item of list){delete item.match}

    let questions = []
    for (const item of list){
        let questionsList = {'person':item.person, 'questions':[], 'yes': 0}
        for (const org of item.organisation){questionsList['questions'].push(`is your character associated with ${org}`)}
        for (const noun of item.nouns){questionsList['questions'].push(`is your character associated with ${noun}`)}
        questions.push(questionsList);
    }
    return questions
}