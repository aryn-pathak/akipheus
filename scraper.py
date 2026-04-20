# this is a scraper to get entries from wikidata.
# using a scraper means we'll get a list of entities much, much smaller than wikidata's list, and doesn't query wikidata to sort through 120M+ entities for every small question, which is abusive to them.

# NOTE: THIS CODE IS ONLY FOR REFERENCE AND DOES NOT REQUIRE RUNNING AGAIN. IT HAS BEEN RUN AND RESULT STORED IN A DATABASE CALLED HUMANS INSIDE A TABLE CALLED HUMANS.

from SPARQLWrapper import SPARQLWrapper, JSON
import json
import pandas as pd
import sqlite3

endpoint_url = "https://query.wikidata.org/sparql"
sparql = SPARQLWrapper(endpoint_url,agent="Akigator/1.0 (thearyanpathak@gmail.com) An open source educational project to recreate how Akinator (classic character guessing game) works. Uses Wikidata's database on humans instead of proprietary closed-source character information like akinator.")

query = """
SELECT ?personLabel ?personDescription ?sexLabel
       (GROUP_CONCAT(DISTINCT ?occupationsLabel; SEPARATOR=",") AS ?occupationLabel)
       (GROUP_CONCAT(DISTINCT ?citizenshipsLabel; SEPARATOR=",") AS ?citizenshipLabel)
       ?sitelinks ?alive ?special
       (GROUP_CONCAT(DISTINCT ?employerItemLabel; SEPARATOR=",") AS ?employerLabel)
       (SAMPLE(?politicalPartyItemLabel) AS ?politicalParty)
       ?followers
WHERE {
    {
        SELECT ?person ?sitelinks (MAX(?f) AS ?followers)
        WHERE {
            ?person wdt:P8687 ?f .
            hint:Prior hint:runFirst true .
            hint:Prior hint:rangeSafe true .
            ?person wdt:P31 wd:Q5 .
            ?person wikibase:sitelinks ?sitelinks .
            FILTER(?f > 500000 && ?sitelinks > 14)
        }
        GROUP BY ?person ?sitelinks
    }
    UNION
    {
        ?person wdt:P31 wd:Q5 ;
                wikibase:sitelinks ?sitelinks .
        hint:Prior hint:rangeSafe true .
        FILTER(?sitelinks > 34)
        MINUS { ?person wdt:P8687 [] }
        BIND(0 AS ?followers)
    }

    ?person wdt:P27 ?citizenships ;
            wdt:P21 ?sex ;
            wdt:P106 ?occupations .

    OPTIONAL { ?person wdt:P570 ?dateDeath . }
    BIND(IF(bound(?dateDeath), "deceased", "alive") AS ?alive)

    OPTIONAL { ?person wdt:P108 ?employerItem . }
    OPTIONAL { ?person wdt:P102 ?politicalPartyItem . }

    BIND(
        IF(bound(?politicalPartyItem), "politician",
            IF(bound(?employerItem), "employed", "no"))
        AS ?special)

    SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en" .
        ?citizenships rdfs:label ?citizenshipsLabel .
        ?occupations rdfs:label ?occupationsLabel .
        ?employerItem rdfs:label ?employerItemLabel .
        ?politicalPartyItem rdfs:label ?politicalPartyItemLabel .
    }
}
GROUP BY ?personLabel ?personDescription ?sexLabel ?sitelinks ?alive ?special ?followers
"""
sparql.setQuery(query)
sparql.setReturnFormat(JSON)

results = sparql.query().convert()

resultsList = []
for result in results["results"]["bindings"]:
    cleanResult = {}
    for key, inner in result.items():
        cleanResult[key] = inner["value"]
    resultsList.append(cleanResult)

with (open('humans.json', 'w') as humans):
    json.dump(resultsList, humans, indent=4)

df=pd.read_json("humans.json")

con = sqlite3.connect("humans.db")
df.to_sql("humansRaw", con, if_exists='replace', index=False)