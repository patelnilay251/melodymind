import { MongoClient } from 'mongodb';
import neo4j from 'neo4j-driver';

let mongoClient;
let neo4jDriver;

async function connectToMongo() {
    if (!mongoClient) {
        mongoClient = new MongoClient(process.env.MONGODB_URI);
        await mongoClient.connect();
    }
    return mongoClient.db('melodymind');
}

function getNeo4jDriver() {
    if (!neo4jDriver) {
        neo4jDriver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
        );
    }
    return neo4jDriver;
}

async function addSongToGraph(artist, title) {
    const session = getNeo4jDriver().session();
    try {
        await session.run(
            `MERGE (a:Artist {name: $artist})
       MERGE (s:Song {title: $title})
       MERGE (a)-[:PERFORMED]->(s)`,
            { artist, title }
        );
    } finally {
        await session.close();
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId, artist, title } = req.body;

        try {
            const db = await connectToMongo();
            await db.collection('listeningHistory').updateOne(
                { userId },
                { $push: { songs: { artist, title, timestamp: new Date() } } },
                { upsert: true }
            );
            await addSongToGraph(artist, title);
            res.status(200).json({ message: 'Song added to listening history and knowledge graph' });
        } catch (error) {
            res.status(500).json({ error: 'Error processing song' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}