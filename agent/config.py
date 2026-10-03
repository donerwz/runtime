# DEV B — Phase 3
# Reads and writes the agent's local config from ~/.runtime/config.json.
#
# Config file shape:
#   {
#     "token":        "raw bearer token",
#     "server_url":   "http://localhost:8000",
#     "tracked_apps": ["Figma", "Visual Studio Code", "Xcode"]
#   }
#
# TODO:
#   Class Config:
#
#   __init__():
#     Set CONFIG_PATH = Path.home() / ".runtime" / "config.json".
#     Create the directory if it doesn't exist.
#     Call self.load().
#
#   load():
#     If CONFIG_PATH exists: parse JSON into self.token, self.server_url, self.tracked_apps.
#     Else: set defaults (token="", server_url="http://localhost:8000", tracked_apps=[]).
#
#   save():
#     Write current values back to CONFIG_PATH as pretty JSON.
#
#   add_app(name: str): add to tracked_apps if not already present, then save().
#   remove_app(name: str): remove from tracked_apps, then save().
#   toggle_app(name: str): add if absent, remove if present, then save().
