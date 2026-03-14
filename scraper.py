# this is a scraper to get entries from wikidata.
# akigator will only use "humans" (non-fictional humans) with >15 sitelinks (somewhat popular, not including ultra-niche people), and having a defined gender, citizenship, occupation (to filter out ghosts), and has a follower count listed
# using a scraper means we'll get a list of entities much, much smaller than wikidata's list, and doesn't query wikidata to sort through 120M+ entities for every small question, which is abusive to them.

from SPARQLWrapper import SPARQLWrapper, JSON
import json

endpoint_url = "https://query.wikidata.org/sparql"
sparql = SPARQLWrapper(endpoint_url, agent="Akigator/1.0 (thearyanpathak@gmail.com) An open source educational project to recreate how Akinator (classic character guessing game) works. Uses Wikidata's database on humans instead of proprietary closed-source character information like akinator.")

query = """
SELECT ?person ?personLabel ?personDescription ?sex ?field ?occupation ?citizenship ?sitelinks (MAX(?rawCount) AS ?followers)
WHERE {
  ?person wdt:P31 wd:Q5 ;
          wdt:P21 ?sex ;
          wdt:P27 ?citizenship ;
          wdt:P106 ?occupation ;
          wdt:P8687 ?rawCount ;
          wdt:P101 ?field ;
          wikibase:sitelinks ?sitelinks .
          
  FILTER(?sitelinks > 20)
  FILTER(?rawCount > 100000)
            
  OPTIONAL { ?person wdt:P101 ?fieldExists . }
  BIND(COALESCE (?fieldExists, 'NIL') as ?field)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?person ?personLabel ?personDescription ?sex ?field ?occupation ?citizenship ?sitelinks
LIMIT 2
"""
sparql.setQuery(query)
sparql.setReturnFormat(JSON)

results = sparql.query().convert()
for result in results["results"]["bindings"]:
    with open("humans.json", "w") as humans:
        json.dump(result, humans, indent=4)