import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// Pass service endpoints
fastify.post('/api/passes', async (request, reply) => {
  return { id: 'pass-123', status: 'created' };
});

fastify.get('/api/passes/:id', async (request, reply) => {
  return { id: request.params.id, data: 'encrypted-blob' };
});

fastify.listen({ port: 3000 }, (err) => {
  if (err) throw err;
  console.log('Pass service running on port 3000');
});
