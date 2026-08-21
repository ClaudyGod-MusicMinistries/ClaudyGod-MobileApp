# ClaudyGod recovery standard

Production recovery is considered ready only when encrypted backups are created off-host and a recent backup has passed an isolated restore drill. A successful upload alone is not proof that a backup is recoverable.

## Service objectives

- Database recovery point objective (RPO): 24 hours maximum; schedule `scripts/backup-database.sh` at least daily.
- Database recovery time objective (RTO): 4 hours from incident declaration to validated service restoration.
- Media recovery: Supabase bucket versioning or provider point-in-time recovery must be enabled and verified in the provider console. The repository cannot truthfully certify that external setting without production credentials.
- Retention: 7 daily, 5 weekly, and 12 monthly encrypted database backups in an access-controlled bucket separate from the application host.

## Backup operation

The backup host requires PostgreSQL client tools, `age`, `sha256sum`, and optionally AWS CLI for any S3-compatible off-host destination.

```bash
DATABASE_URL='postgresql://…' \
BACKUP_AGE_RECIPIENT='age1…' \
BACKUP_DIRECTORY='/srv/claudygod/backups' \
BACKUP_S3_URI='s3://claudygod-recovery/database' \
bash scripts/backup-database.sh
```

Store the age private identity outside the application host and outside the backup bucket. Alert when no new encrypted object is present within 26 hours. Bucket lifecycle rules implement the approved retention schedule; those rules must be reviewed in the provider console during each quarterly drill.

## Mandatory restore drill

Provision a new, empty, isolated PostgreSQL database. Never point the verifier at production or a shared staging database.

```bash
RESTORE_DATABASE_URL='postgresql://…isolated-empty-db…' \
BACKUP_AGE_IDENTITY_FILE='/secure/recovery-key.txt' \
BACKUP_FILE='/srv/claudygod/backups/claudygod-YYYYMMDDTHHMMSSZ.dump.age' \
ALLOW_RESTORE_VERIFICATION=true \
bash scripts/verify-database-restore.sh
```

The verifier checks the encrypted artifact checksum, refuses a non-empty target, restores with fail-fast behavior, and verifies the critical schema. Record start/end time, backup timestamp, restored row counts, operator, and incident/drill identifier in the security audit record. Perform this drill quarterly and before declaring a major release production-ready.
