import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserService } from '../src/user/user.service';

async function backfillEmailLower() {
  console.log('Starting emailLower backfill process...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);
  
  try {
    // Get all users without emailLower
    const usersWithoutEmailLower = await userService['userModel'].find({
      $or: [
        { emailLower: { $exists: false } },
        { emailLower: null },
        { emailLower: '' }
      ]
    });

    console.log(`Found ${usersWithoutEmailLower.length} users without emailLower`);

    if (usersWithoutEmailLower.length === 0) {
      console.log('No users need emailLower backfill');
      return;
    }

    // Update users in batches
    const batchSize = 100;
    let processed = 0;

    for (let i = 0; i < usersWithoutEmailLower.length; i += batchSize) {
      const batch = usersWithoutEmailLower.slice(i, i + batchSize);
      
      const bulkOps = batch.map(user => ({
        updateOne: {
          filter: { _id: user._id },
          update: { 
            $set: { 
              emailLower: user.email.toLowerCase(),
              updatedAt: new Date()
            } 
          }
        }
      }));

      await userService['userModel'].bulkWrite(bulkOps);
      processed += batch.length;
      
      console.log(`Processed ${processed}/${usersWithoutEmailLower.length} users`);
    }

    console.log('EmailLower backfill completed successfully');
    
  } catch (error) {
    console.error('Error during emailLower backfill:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the script
if (require.main === module) {
  backfillEmailLower()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { backfillEmailLower };
