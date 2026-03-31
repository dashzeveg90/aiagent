#!/bin/sh

set -eu

DATA_DIR="${HOME}/.aiagent/mongodb"
LOG_DIR="${HOME}/.aiagent/logs"
LOG_FILE="${LOG_DIR}/mongodb.log"

mkdir -p "${DATA_DIR}" "${LOG_DIR}"

if pgrep -f "mongod --dbpath ${DATA_DIR}" >/dev/null 2>&1; then
  echo "MongoDB already running with dbPath ${DATA_DIR}"
  exit 0
fi

mongod \
  --dbpath "${DATA_DIR}" \
  --bind_ip 127.0.0.1 \
  --port 27017 \
  --logpath "${LOG_FILE}" \
  --fork

echo "MongoDB started"
echo "dbPath: ${DATA_DIR}"
echo "log: ${LOG_FILE}"
