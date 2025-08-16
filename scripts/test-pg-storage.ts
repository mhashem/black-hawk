import 'dotenv/config';
import { storage as storageImpl } from '../server/storage';

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not set - skipping PG storage test');
    process.exit(1);
  }

  const storage: any = storageImpl;

  console.log('Creating service...');
  const svc = await storage.createService({ name: 'test', url: 'http://localhost', group: 'test' });
  console.log('Created:', svc.id);

  console.log('Fetching service...');
  const fetched = await storage.getService(svc.id);
  console.log('Fetched:', !!fetched);

  console.log('Updating service...');
  await storage.updateService(svc.id, { name: 'test2' });
  const updated = await storage.getService(svc.id);
  console.log('Updated name:', updated.name);

  console.log('Upserting health data...');
  await storage.upsertHealthData({ serviceId: svc.id, status: 'UP' });
  const health = await storage.getHealthDataByServiceId(svc.id);
  console.log('Health status:', health.status);

  console.log('Deleting service...');
  const deleted = await storage.deleteService(svc.id);
  console.log('Deleted:', deleted);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
