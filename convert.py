import sqlite3
import pandas as pd

df = pd.read_csv('humans.csv')
df["sitelinks"] = pd.to_numeric(df["sitelinks"])
df["followers"] = pd.to_numeric(df["followers"])

con = sqlite3.connect("humans.db")
df.to_sql("humansRaw", con, if_exists='replace', index=False)