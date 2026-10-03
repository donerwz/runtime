# DEV A — Phase 1
# Main seeder script. Run with: python -m seed.seed
#
# TODO:
#   1. Connect to Tiger Data using DATABASE_URL from .env.
#   2. Call fake_data.py generators to produce:
#        - 1 supervisor user
#        - 5 volunteer users, all in a cohort owned by the supervisor
#        - ~2 weeks of realistic heartbeats per volunteer (see fake_data.py)
#        - Corresponding shift rows with tracked_minutes populated
#   3. Insert all rows. Use ON CONFLICT DO NOTHING so the script is re-runnable.
#   4. Print a summary: "Inserted X heartbeats across Y users."
#
# Run migrations first: python -m seed.run_migrations
