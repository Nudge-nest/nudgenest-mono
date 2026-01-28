FROM rabbitmq:4.1.0-beta.2-alpine

# Set environment variables
ENV RABBITMQ_DEFAULT_USER=nudgenest
ENV RABBITMQ_DEFAULT_PASS=password

# Enable RabbitMQ plugins
RUN rabbitmq-plugins enable rabbitmq_federation rabbitmq_federation_management

# Copy custom configuration
COPY rabbitmq.conf /etc/rabbitmq/rabbitmq.conf

# Expose necessary ports
EXPOSE 5672 15672

# Start RabbitMQ
CMD ["rabbitmq-server"]