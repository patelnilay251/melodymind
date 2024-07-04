import { MongoClient } from 'mongodb';

let mongoClient;

async function connectToMongo() {
    if (!mongoClient) {
        mongoClient = new MongoClient(process.env.MONGODB_URI);
        await mongoClient.connect();
    }
    return mongoClient.db('melodymind');
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { userId } = req.query;

        try {
            const db = await connectToMongo();
            const history = await db.collection('listeningHistory').findOne({ userId });
            res.status(200).json(history ? history.songs : []);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching listening history' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}