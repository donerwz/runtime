# DEV B — Phase 3
# macOS system tray icon and menu using rumps.
#
# TODO:
#   Class RuntimeTrayApp(rumps.App):
#
#   __init__(tracker: Tracker, config: Config):
#     super().__init__("Runtime", quit_button="Quit Runtime")
#     Build the initial menu (see _build_menu).
#
#   _build_menu():
#     Menu structure:
#       "Today: X min"              ← updated every 60s via @rumps.timer
#       ────────────────
#       "Tracking: <N> apps"        ← opens app picker
#       [dynamic list of currently RUNNING apps with checkmarks for tracked ones]
#           ✓ Figma
#             Slack
#           ✓ Visual Studio Code
#             Chrome
#       ────────────────
#       "Pause / Resume"
#       ────────────────
#       "Set API Token..."          ← opens a text input dialog
#
#   @rumps.clicked("Pause / Resume")
#     Call tracker.toggle_pause(). Update menu item title to reflect state.
#
#   @rumps.clicked("Set API Token...")
#     Show rumps.Window prompt for token input.
#     Save to config.token and write config to disk.
#
#   App picker (clicking a running app name in the menu):
#     Toggle that app in config.tracked_apps and write config to disk.
#     Refresh the menu.
#
#   _get_running_apps() -> list[tuple[str, str]]:
#     Use NSWorkspace.sharedWorkspace().runningApplications() to list
#     all currently open apps (name, bundle_id). Filter out background-only processes.
#
#   @rumps.timer(60)
#   _update_status(sender):
#     Call api.get_today_minutes() and update the "Today: X min" menu item.
