# this is a scraper to get entries from wikidata.
# akigator will only use "humans" (non-fictional humans) with >25 sitelinks (somewhat popular, not including ultra-niche people), and having a defined gender, citizenship, occupation (to filter out ghosts), and has a follower count listed
# using a scraper means we'll get a list of entities much, much smaller than wikidata's list, and doesn't query wikidata to sort through 120M+ entities for every small question, which is abusive to them.

# NOTE: THIS CODE IS ONLY FOR REFERENCE AND DOES NOT REQUIRE RUNNING AGAIN. IT HAS BEEN RUN AND RESULT STORED IN A DATABASE CALLED HUMANS INSIDE A TABLE CALLED HUMANS.

from SPARQLWrapper import SPARQLWrapper, JSON
import json
import pandas as pd
import sqlite3

endpoint_url = "https://query.wikidata.org/sparql"
sparql = SPARQLWrapper(endpoint_url, agent="Akigator/1.0 (thearyanpathak@gmail.com) An open source educational project to recreate how Akinator (classic character guessing game) works. Uses Wikidata's database on humans instead of proprietary closed-source character information like akinator.")

query = """
SELECT DISTINCT ?personLabel ?personDescription ?sexLabel ?occupationLabel ?citizenshipLabel ?sitelinks ?alive ?special ?employerLabel ?politicalPartyLabel (MAX(?rawCount) AS ?followers)
WHERE {
    ?person   wdt:P31 wd:Q5 ;
              wdt:P27 ?citizenship ;
              wdt:P21 ?sex ;
              wikibase:sitelinks ?sitelinks ;
              wdt:P106 ?occupation .

    OPTIONAL {?person wdt:P8687 ?followersExist .}
    BIND(COALESCE(?followersExist, 0) AS ?rawCount)      # some people don't have a mentioned "followers" property. To avoid breaking the FILTER set NIL to zero
    
    OPTIONAL {?person wdt:P970 ?dateDeath .}
    BIND(IF(bound(?deathDate), "NO", "YES"))
    
    OPTIONAL {?person p:P108 ?emp
    ?emp prov:wasDerivedFrom ?ref ;
        ps:P108 ?employerName .}
    BIND(COALESCE(?employerName, "NIL") AS ?employer)
    
    OPTIONAL {?person p:P102 ?pp
    ?pp prov:wasDerivedFrom ?ref ;
        ps:P102 ?ppName .}
    BIND(COALESCE(?ppName, "NIL") AS ?politicalParty)
    
    
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?personLabel ?personDescription ?sexLabel ?occupationLabel ?citizenshipLabel ?sitelinks
HAVING (
    (MAX(?rawCount) > 1000000 && ?sitelinks > 15) ||
    (MAX(?rawCount) > 2000000) ||
    (?sitelinks > 34 && MAX(?rawCount) = 0)
)
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