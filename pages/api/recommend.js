import neo4j from 'neo4j-driver';

let neo4jDriver;

function getNeo4jDriver() {
    if (!neo4jDriver) {
        neo4jDriver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
        );
    }
    return neo4jDriver;
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { artist } = req.query;

        try {
            const session = getNeo4jDriver().session();
            const result = await session.run(
                `MATCH (a:Artist {name: $artist})-[:PERFORMED]->(s:Song)<-[:PERFORMED]-(relatedArtist:Artist)
         WHERE a <> relatedArtist
         RETURN DISTINCT relatedArtist.name AS artist, s.title AS song
         LIMIT 5`,
                { artist }
            );
            await session.close();

            const recommendations = result.records.map(record => ({
                artist: record.get('artist'),
                song: record.get('song')
            }));

            res.status(200).json(recommendations);
        } catch (error) {
            res.status(500).json({ error: 'Error generating recommendations' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}