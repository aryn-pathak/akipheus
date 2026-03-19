# refer to scraper.py for scraping logic and getting humans.db

# the table humansRaw inside humans.db has ~10k rows, since each occupation/citizenship/field of work for a particular person creates a new row.
# this code "flattens" the table, in the sense that there's one row per person, but multiple occupations are simply separated by commas.

import sqlite3
import pandas as pd

con = sqlite3.connect("humans.db")
df = pd.read_sql("SELECT * FROM humansRaw", con)

grouped = df.groupby('personLabel').agg({
    'personDescription': 'first',
    'sexLabel': 'first',
    'field': ','.join,
    'occupationLabel': ','.join,
    'citizenshipLabel': ','.join,
    'sitelinks': 'first',
    'followers': 'first'
}).reset_index()
grouped.to_sql("humansFlat", con, if_exists='replace', index=False)

con.close()