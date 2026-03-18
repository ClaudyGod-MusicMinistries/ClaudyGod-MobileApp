FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends debconf-utils ca-certificates \
  && echo "postfix postfix/mailname string localhost" | debconf-set-selections \
  && echo "postfix postfix/main_mailer_type select Satellite system" | debconf-set-selections \
  && apt-get install -y --no-install-recommends postfix libsasl2-modules \
  && apt-get purge -y --auto-remove debconf-utils \
  && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/postfix-entrypoint.sh
RUN chmod +x /usr/local/bin/postfix-entrypoint.sh

EXPOSE 25

ENTRYPOINT ["/usr/local/bin/postfix-entrypoint.sh"]
CMD ["postfix", "start-fg"]
