import {getAll} from "./db.js";
import {init} from "./db.js";

let obj = {"citizenshipLabel":[], "sexLabel":[], "occupationLabel":[], "field":[], "special":[], "pp":[], "employer":[], "alive":[]};
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

function getPopular(property, obj){         // property is the key name. obj is obj. func is getAll()
    let people = getAll(obj)[0].values
    let index
    let countriesRaw = []
    let countriesUnique = []

    index = (property == "citizenshipLabel") ? 4 : 3;
    people.forEach((item) => {
        countriesRaw.push(...item[index])
    })
    countriesUnique = [...new Set(countriesRaw)];
}
init().then(() => {
    console.log(getPopular("citizenshipLabel"), obj);
});