# DEV B — Phase 3
# Polls the active macOS application and sends heartbeats to the Runtime backend.
#
# TODO:
#   Class Tracker (runs in a background thread)
#
#   __init__(config: Config, api: ApiClient):
#     Store config and api. Set self.paused = False, self._last_sent = 0.
#
#   run():
#     Loop every 5 seconds (polling interval):
#       - If paused: skip.
#       - Get the frontmost app using pyobjc:
#           ws = AppKit.NSWorkspace.sharedWorkspace()
#           app = ws.frontmostApplication()
#           app_name   = app.localizedName()      # e.g. "Figma"
#           app_bundle = app.bundleIdentifier()   # e.g. "com.figma.Desktop"
#       - If app_name is not in config.tracked_apps: skip.
#       - If fewer than 30 seconds since last heartbeat: skip (throttle).
#       - Call api.post_heartbeat(app_name, app_bundle, focused=True).
#       - Update self._last_sent.
#       - On any exception: print to stderr and continue (never crash the loop).
#
#   toggle_pause(): flips self.paused; called from tray.py.
