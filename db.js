let db
export let obj = {"citizenshipLabel":[], "sexLabel":[], "occupationLabel":[], "field":[], "special":[], "political party":[], "employer":[], "alive":[]};
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
    for (let key of o) {
        for (let filter of o[key]) {
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
function bayesian(M, S, R){          // M: global P avg, C: weight, S: no of occurrences, R: avg P of particular
    return ((20*M)+(S*R))/(20+S)
}
// getAll() returns columns and values separately, values is an array, not key-value pairs
export function getPopular(property, obj){
    let people = getAll(obj)[0].values
    let index
    let raw = []

    index = (property === "citizenshipLabel") ? 4 : 3; // need to change indices to match, allow sex/citizenship/occupation/field/political party/employer

    people.forEach((item) => {
        for(name of item){
            const object = {"name": name, "P":item[7]};  // change to P's index
        }
        raw.push(object)
    })

    let unique = []
    raw.forEach((item) => {
        if (unique.includes(item.name)){}else{
            unique.push(item.name)
        }
    })
    const M = raw.reduce((acc, o)=>acc + o.P, 0);/unique.length

    let aggregate = []
    for (const item of unique){
        let filtered = raw.filter(o => o.name === item).map(o => o.P);
        let totalP = filtered.reduce((acc, no)=>acc + no);
        aggregate.push({"name":item, "S":filtered.length, "B":bayesian(M, C, totalP, (totalP/filtered.length))});
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
    let returnList = []
    for (const person of descList){
        let desc = descList.desc

        let organisation = desc.organisations().out('array')
        let nouns = desc.nouns().out('array').filter(item =>
            !obj.occupationLabel.includes(item) &&
            !obj.occupationLabel.includes(`NOT ${item}`)
        ) // removes occupations already filtered, leaves titles and uncovered occupations
        list.push({'person':person.person, 'organisation':organisation,'nouns':nouns, 'P':person.P})
    }
    list.sort((a, b) => b.P - a.P)
    for(const item of list){delete item.P}

    let questions = []
    for (const item of list){
        let questionsList = {'person':item.person, 'questions':[]}
        for (const org of item.organisation){questionsList['questions'].push(`is your character associated with ${org}`)}
        for (const noun of item.nouns){questionsList['questions'].push(`is your character associated with ${noun}`)}
    }
    return questions
}