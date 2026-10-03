# DEV B — Phase 3
# Entry point for the Runtime desktop agent.
# Run with: python -m agent.main
#
# TODO:
#   1. Load .env (token, server URL) using python-dotenv.
#   2. Instantiate Config (config.py) — loads ~/.runtime/config.json.
#   3. Instantiate Tracker (tracker.py) and start it in a background thread.
#      (rumps blocks the main thread, so the tracker must run in a daemon thread.)
#   4. Instantiate RuntimeTrayApp (tray.py) and call app.run() — this blocks.
#
# Acceptance: running this script shows a menu bar icon on macOS.
#             Quitting the tray app also stops the tracker thread.
