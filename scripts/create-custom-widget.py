#!/usr/bin/env python3
"""Bootstrap a custom sidebar widget for SuperEarth Dispatch.

Reddit's custom widget create path is unreliable from Devvit (imageData/name).
Run this once per subreddit as a moderator, then let the Devvit app update
text/css/height on refresh and cron sync.

Required environment variables:
  REDDIT_CLIENT_ID
  REDDIT_CLIENT_SECRET
  REDDIT_USERNAME
  REDDIT_PASSWORD

Optional:
  SED_SUBREDDIT (default: superearth_dispat_dev)
  REDDIT_USER_AGENT (default: superearth-dispatch-widget-bootstrap)

Usage:
  pip install -r scripts/requirements.txt
  export REDDIT_CLIENT_ID=...
  export REDDIT_CLIENT_SECRET=...
  export REDDIT_USERNAME=...
  export REDDIT_PASSWORD=...
  python scripts/create-custom-widget.py
"""

from __future__ import annotations

import os
import sys

import praw

SHORT_NAME = "SuperEarth Dispatch"
DEFAULT_SUBREDDIT = "superearth_dispat_dev"
STYLES = {
    "backgroundColor": "#0d0f11",
    "headerColor": "#ffb900",
}
PLACEHOLDER_TEXT = (
    "# SuperEarth Dispatch\n\n"
    "*Orders will appear after the app refreshes.*"
)


def widget_short_name(widget: object) -> str | None:
    for attr in ("shortName", "short_name", "displayName"):
        value = getattr(widget, attr, None)
        if isinstance(value, str) and value:
            return value
    return None


def find_existing_widget(subreddit: praw.models.Subreddit) -> object | None:
    for widget in subreddit.widgets.sidebar:
        if widget_short_name(widget) == SHORT_NAME:
            return widget
    return None


def main() -> int:
    missing = [
        name
        for name in ("REDDIT_CLIENT_ID", "REDDIT_CLIENT_SECRET", "REDDIT_USERNAME", "REDDIT_PASSWORD")
        if not os.environ.get(name)
    ]
    if missing:
        print(f"Missing required environment variables: {', '.join(missing)}", file=sys.stderr)
        return 1

    subreddit_name = os.environ.get("SED_SUBREDDIT", DEFAULT_SUBREDDIT)
    user_agent = os.environ.get(
        "REDDIT_USER_AGENT",
        "superearth-dispatch-widget-bootstrap by u/" + os.environ["REDDIT_USERNAME"],
    )

    reddit = praw.Reddit(
        client_id=os.environ["REDDIT_CLIENT_ID"],
        client_secret=os.environ["REDDIT_CLIENT_SECRET"],
        username=os.environ["REDDIT_USERNAME"],
        password=os.environ["REDDIT_PASSWORD"],
        user_agent=user_agent,
    )

    subreddit = reddit.subreddit(subreddit_name)
    existing = find_existing_widget(subreddit)
    if existing is not None:
        widget_id = getattr(existing, "id", None) or getattr(existing, "widget_id", "unknown")
        print(f'Widget "{SHORT_NAME}" already exists in r/{subreddit_name}: {widget_id}')
        return 0

    widget = subreddit.widgets.mod.add_custom_widget(
        short_name=SHORT_NAME,
        text=PLACEHOLDER_TEXT,
        css="/**/",
        height=200,
        image_data=[],
        styles=STYLES,
    )

    widget_id = getattr(widget, "id", None) or getattr(widget, "widget_id", "unknown")
    print(f'Created custom widget "{SHORT_NAME}" in r/{subreddit_name}: {widget_id}')
    print("Upload the Devvit app, then run refresh or wait for cron sync to populate orders.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
