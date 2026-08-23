#!/bin/sh
# Nightly backup of the one file that matters.
#
# The SQLite database holds every account, friendship, training day, personal
# best, and game save. A backup is a copy; this keeps seven, one per weekday,
# using SQLite's own .backup so a mid-write copy cannot be torn.
#
#   crontab -e
#   0 3 * * * /opt/companion-quest/server/deploy/backup.sh
#
# Ideally sync $DEST somewhere off the machine too (rclone, rsync, anything).

DB="${FRIENDS_DB:-/opt/companion-quest/server/friends.db}"
DEST="${BACKUP_DIR:-/var/backups/companionquest}"
mkdir -p "$DEST"
DAY=$(date +%u)
sqlite3 "$DB" ".backup '$DEST/friends-$DAY.db'"
