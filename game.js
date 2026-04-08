import {getAll} from "./db.js";
import {init} from "./db.js";

let obj = {"citizenshipLabel":[], "sexLabel":[], "occupationLabel":[], "field":[], "special":[], "political party":[], "employer":[], "alive":[]};
let statements = {          // statements for framing questions about particular characteristics
    "sexLabel":"is your character a ",
    "citizenshipLabel":"is your character from",
    "occupationLabel":"is your character a ",
    "field":"is your character related to ",
    "special":"is your character ", // a politician - politician OR employed by a corporation - employed
    "pp":"is your character in ",
    "employer":"is your character employed by ",
}

function bayesian(M, C, S, R){          // M: avg P of all, C: weight, S: sum of P for particular, R: avg P of particular
    return ((C*M)+(S*R))/(C+S)
}

// citizenshipLabel is [4], occupationLabel is [3]. getAll() returns columns and values separately, values is an array, not key-value pairs
function getPopular(property, obj){         // property is the key name (citizenshipLabel or occupationLabel), obj is obj.
    let people = getAll(obj)[0].values
    let index
    let raw = []

    index = (property === "citizenshipLabel") ? 4 : 3; // need to change to allow support for all properties

    people.forEach((item) => {
        const object = {"name":item[index], "P":item[7]}    // this too
        raw.push(object)
    })

    let unique = []
    raw.forEach((item) => {
        if (unique.includes(item.name)){}else{
            unique.push(item.name)
        }
    })

    let aggregate = []
    for (const item in unique){
       let filtered = raw.filter(o => o.name === item).map(o => o.P);
       let totalP = filtered.reduce((acc, no)=>acc + no);
       aggregate.push({"name":item, "S":totalP, "R":(totalP/filtered.length)});
    }
    aggregate.sort((a, b)=>b.S-a.S)

    let result = ""
    for (let i=0; i<aggregate.length; i++){
        if(obj[property].includes(aggregate[i].name)){
            continue;
        }else{result = aggregate[i];
        break;}
    }
    return result;
}