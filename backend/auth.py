# DEV A — Phase 2
# Bearer token authentication.
#
# TODO:
#   1. Write a generate_token() function: create a random 32-byte token,
#      hash it with bcrypt (passlib), store the hash in the users table.
#      Print the raw token to stdout — that's what the user puts in .env / VS Code.
#   2. Write a verify_token(raw_token) async function: hash the incoming token,
#      look up the hash in the users table, return the user row or raise 401.
#   3. Expose a FastAPI dependency get_current_user() that reads
#      the Authorization header, calls verify_token, and returns the user.
#   4. Add a require_supervisor() dependency that checks role == "supervisor".
#
# Run standalone to generate a token:
#   python -m backend.auth <user_id>
