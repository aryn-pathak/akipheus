# refer to scraper.py for scraping logic and getting humans.db
import json
# the table humansRaw inside humans.db has ~10k rows, since each occupation/citizenship/field of work for a particular person creates a new row.
# this code "flattens" the table, in the sense that there's one row per person, but multiple occupations are simply separated by commas.

import sqlite3
import numpy as np
import pandas as pd

con = sqlite3.connect("humans.db")
df = pd.read_sql("SELECT * FROM humansRaw", con)
df = df.drop_duplicates(subset=['occupationLabel', 'citizenshipLabel', 'sexLabel', 'sitelinks', 'followers'])

grouped = df.groupby('personLabel').agg({
    'personDescription': 'first',
    'sexLabel': 'first',
    'occupationLabel': lambda x: json.dumps(list(set(x))),
    'citizenshipLabel': lambda x: json.dumps(list(set(x))),
    'followers':'first',
    'sitelinks': 'first',
    'alive': 'first',
    'special':'first',
    'political party': lambda x: json.dumps(list(set(x))),
     'P': 'first'
}).reset_index()

conditions = [
    (grouped['followers'] == 0),
    (grouped['followers'] <= 1_000_000),
    (grouped['followers'] <= 5_000_000),
    (grouped['followers'] <= 25_000_000),
    (grouped['followers'] <= 100_000_000),
    (grouped['followers'] <= 300_000_000),
]
choices = [
    150_000 + (grouped['sitelinks'] * 50_000),
    grouped['followers'] + (grouped['sitelinks'] * 50_000),
    grouped['followers'] + (grouped['sitelinks'] * 25_000),
    grouped['followers'] + (grouped['sitelinks'] * 10_000),
    grouped['followers'] + (grouped['sitelinks'] * 5_000),
    grouped['followers'] + (grouped['sitelinks'] * 2_000),
]

default = grouped['followers'] + (grouped['sitelinks'] * 0)

grouped['P'] = np.select(conditions, choices, default=default)

grouped.to_sql("humansFlat", con, if_exists='replace', index=False)

con.close()