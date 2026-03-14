# this is a scraper to get entries from wikidata.
# akigator will only use "humans" (non-fictional humans) with >15 sitelinks (somewhat popular, not including ultra-niche people), and having a defined gender, citizenship, occupation (to filter out ghosts)
# using a scraper means we'll get a list of entities much, much smaller than wikidata's list, and doesn't query wikidata to sort through 120M+ entities for every small question, which is abusive to them.

import pandas as pd
from SPARQLWrapper import SPARQLWrapper, JSON
import json

endpoint_url = "https://query.wikidata.org/sparql"
sparql = SPARQLWrapper(endpoint_url, agent="Akigator/1.0 (thearyanpathak@gmail.com) An open source educational project to recreate how Akinator (classic character guessing game) works. Uses Wikidata's database on humans instead of proprietary closed-source character information like akinator.")

query = """
SELECT ?person ?personLabel ?personDescription ?sex ?field ?occupation ?followers ?citizenship ?sitelinks
WHERE {
  ?person wdt:P31 wd:Q5 ;
            wdt:P21 ?sex ;
            wdt:P27 ?citizenship ;
            wdt:P106 ?occupation ;
            
            OPTIONAL { ?person wdt:P101 ?fieldExists . }
            BIND(COALESCE (?fieldExists, 'NIL') as ?field)
            
            wdt:P8687 ?followersExist ;     # doesn't display no. of followers, just removes anyone with no "social media followers" mentioned. Different than ?followers
            wikibase:sitelinks ?sitelinks .
            
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    
    # getting followers, it is simply a numerical measure of "popularity" that'll be used in the game logic, so platform doesn't matter and we only take the max no. of followers
    
    OPTIONAL {                                      # YouTube
        ?person p:P2397 ?yt .
        ?yt ps:P2397 ?ytVal .
        OPTIONAL { ?yt pq:P585 ?ytDate . }    
            
        FILTER NOT EXISTS {
            ?person p:P2397 ?ytNew .
            ?ytNew pq:P585 ?ytDateNew .
            FILTER(?ytDateNew > ?ytDate)
        }
    }
    OPTIONAL {                                      # Instagram
        ?person p:P2003 ?ig .
        ?ig ps:P2003 ?igVal .
        OPTIONAL { ?ig pq:P585 ?igDate . }    
            
        FILTER NOT EXISTS {
            ?person p:P2003 ?igNew .
            ?igNew pq:P585 ?igDateNew .
            FILTER(?igDateNew > ?igDate)
        }
    }
    OPTIONAL {                                      # X (formerly Twitter)
        ?person p:P6552 ?x .
        ?x ps:P6552 ?xVal .
        OPTIONAL { ?x pq:P585 ?xDate . }    
            
        FILTER NOT EXISTS {
            ?person p:P6552 ?xNew .
            ?xNew pq:P585 ?xDateNew .
            FILTER(?xDateNew > ?xDate)
        }
    }
    OPTIONAL {                                      # Facebook
        ?person p:P2013 ?fb .
        ?fb ps:P2013 ?fbVal .
        OPTIONAL { ?fb pq:P585 ?fbDate . }    
            
        FILTER NOT EXISTS {
            ?person p:P2013 ?fbNew .
            ?fbNew pq:P585 ?fbDateNew .
            FILTER(?fbDateNew > ?fbDate)
        }
        
    BIND(MAX(COALESCE(?ytVal, 0), COALESCE(?xVal, 0), COALESCE(?fbVal, 0), COALESCE(?igVal, 0)) as ?followers)      # the no. of followers of the platform with highest no. of followers will be considered
    }
}

"""
sparql.setQuery(query)
sparql.setReturnFormat(JSON)

results = sparql.query().convert()
for result in results["results"]["bindings"]:
    with open("humans.json", "w") as humans:
        json.dump(result, humans, indent=4)