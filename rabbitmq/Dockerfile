FROM rabbitmq:3.13-management-alpine

RUN apk add --no-cache curl && \
    curl -L https://github.com/rabbitmq/rabbitmq-delayed-message-exchange/releases/download/v3.13.0/rabbitmq_delayed_message_exchange-3.13.0.ez \
    -o /opt/rabbitmq/plugins/rabbitmq_delayed_message_exchange-3.13.0.ez

COPY enabled_plugins /etc/rabbitmq/enabled_plugins