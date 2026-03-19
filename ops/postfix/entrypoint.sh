#!/bin/sh
set -eu

: "${POSTFIX_MYHOSTNAME:?POSTFIX_MYHOSTNAME is required}"
: "${POSTFIX_RELAY_HOST:?POSTFIX_RELAY_HOST is required}"
: "${POSTFIX_RELAY_PORT:?POSTFIX_RELAY_PORT is required}"
: "${POSTFIX_SMTP_USERNAME:?POSTFIX_SMTP_USERNAME is required}"
: "${POSTFIX_SMTP_PASSWORD:?POSTFIX_SMTP_PASSWORD is required}"

cat > /etc/postfix/sasl_passwd <<EOF
[${POSTFIX_RELAY_HOST}]:${POSTFIX_RELAY_PORT} ${POSTFIX_SMTP_USERNAME}:${POSTFIX_SMTP_PASSWORD}
EOF

chmod 600 /etc/postfix/sasl_passwd
postmap /etc/postfix/sasl_passwd

postconf -e "myhostname = ${POSTFIX_MYHOSTNAME}"
postconf -e "inet_interfaces = all"
postconf -e "inet_protocols = ipv4"
postconf -e "mydestination ="
postconf -e "mynetworks = 127.0.0.0/8 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16"
postconf -e "relayhost = [${POSTFIX_RELAY_HOST}]:${POSTFIX_RELAY_PORT}"
postconf -e "smtpd_recipient_restrictions = permit_mynetworks,reject_unauth_destination"
postconf -e "smtpd_relay_restrictions = permit_mynetworks,reject_unauth_destination"
postconf -e "smtp_sasl_auth_enable = yes"
postconf -e "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd"
postconf -e "smtp_sasl_security_options = noanonymous"
postconf -e "smtp_tls_security_level = encrypt"
postconf -e "smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt"
postconf -e "smtp_tls_note_starttls_offer = yes"
postconf -e "smtp_tls_loglevel = 1"

if postconf -d maillog_file >/dev/null 2>&1; then
  postconf -e "maillog_file = /dev/stdout"
fi

exec "$@"
