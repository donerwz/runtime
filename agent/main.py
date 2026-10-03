import sys
from dotenv import load_dotenv
load_dotenv()

from agent.config import Config
from agent.api import ApiClient
from agent.tracker import Tracker


def main():
    config = Config()
    api = ApiClient(config)
    tracker = Tracker(config, api)
    tracker.start()

    if sys.platform == "darwin":
        from agent.tray_mac import RuntimeTrayApp
    else:
        from agent.tray_win import RuntimeTrayApp

    RuntimeTrayApp(tracker, config, api).run()


if __name__ == "__main__":
    main()
