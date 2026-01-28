/* Create and initiate Google Cloud Pub/Sub, replacing RabbitMQ */
import Hapi from '@hapi/hapi';
import { PubSub, Topic } from '@google-cloud/pubsub';
import * as dotenv from 'dotenv';

dotenv.config();

declare module '@hapi/hapi' {
    interface ServerApplicationState {
        pubsub: {
            client: PubSub;
            messagingTopic: Topic;
        };
    }
}

// Topic name
export const messagingTopicName = 'nudgenest-messaging';

const pubsubPlugin: Hapi.Plugin<null> = {
    name: 'pubsub',
    register: async (server: Hapi.Server) => {
        try {
            // Initialize Pub/Sub client
            const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'nudgenest';

            // If you're using a service account key file
            const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

            const pubsubClient = new PubSub({
                projectId,
                ...(keyFilePath && { keyFilename: keyFilePath })
            });

            // Get or create the topic
            const topicName = messagingTopicName;
            const [topics] = await pubsubClient.getTopics();
            let messagingTopic = topics.find(t => t.name.endsWith(topicName));


            if (!messagingTopic) {
                console.log(`📝 Creating Pub/Sub topic: ${topicName}`);
                [messagingTopic] = await pubsubClient.createTopic(topicName);
            }

            server.app.pubsub = {
                client: pubsubClient,
                messagingTopic
            };

            console.log('✅ Google Cloud Pub/Sub connection established and ready');
            console.log(`📌 Project: ${projectId}`);
            console.log(`📌 Topic: ${messagingTopic.name}`);

        } catch (err) {
            console.error('❌ Error connecting to Google Cloud Pub/Sub:', err);
            throw err;
        }

        // Gracefully close Pub/Sub connection on server shutdown
        server.ext('onPostStop', async () => {
            if (server.app.pubsub) {
                console.log('🔌 Closing Google Cloud Pub/Sub connection...');
                await server.app.pubsub.client.close();
            }
        });
    },
};

export default pubsubPlugin;
