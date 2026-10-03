# DEV A — Phase 4
# Gemini assessment pipeline using the google-genai SDK.
# This is the prize feature — read PLAN.md Phase 4 carefully before starting.
#
# TODO:
#
#   assess_day(user_id, date) -> AssessmentResult
#     1. Gather evidence:
#        - Fetch tracked minutes, projects, languages from DB for that day.
#        - Fetch the user's GitHub commits/PRs via GitHub API (GITHUB_TOKEN in .env).
#        - Fetch the volunteer's check-in text from daily_assessments if it exists.
#     2. Build a Gemini prompt with the fixed rubric from PLAN.md Phase 4.
#     3. Use structured output (JSON schema) to get back the AssessmentResult shape.
#        Schema: progress, difficulty_handled, collaboration, consistency,
#                blockers[], highlights[], evidence[] (each score cites specific evidence).
#     4. Validate the response. Retry once on invalid output; save error state if still fails.
#     5. Write the result to daily_assessments table.
#
#   weekly_synthesis(supervisor_id, week_start) -> str
#     1. Load all daily_assessments for the supervisor's cohort for that week.
#     2. Feed into a single long-context Gemini call.
#     3. Return a supervisor-facing narrative: trends, who is stuck, who deserves recognition.
#
#   Function calling tools to give Gemini:
#     get_commits(user_id, date)          — fetches from GitHub API
#     get_recent_assessments(user_id, n)  — fetches from daily_assessments table
#
# Framing reminder (PLAN.md): scores are advisory, not grades. Non-coding work must not
# be penalized. Rubric must be identical for all users.
