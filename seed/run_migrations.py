import os
import psycopg
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

def run():
    sql_path = Path(__file__).parent.parent / "backend" / "migrations" / "001_init.sql"
    sql = sql_path.read_text()
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        conn.execute(sql)
        conn.commit()
    print("Migrations applied.")

if __name__ == "__main__":
    run()
