import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserService } from '../src/user/user.service';

async function ensureIndexes() {
  console.log('Starting index verification and creation...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);
  
  try {
    const collection = userService['userModel'].collection;
    
    // Get existing indexes
    const existingIndexes = await collection.indexes();
    console.log('Existing indexes:');
    existingIndexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Ensure emailLower unique index
    console.log('\nEnsuring emailLower unique index...');
    try {
      await collection.createIndex({ emailLower: 1 }, { unique: true });
      console.log('✓ emailLower unique index created/verified');
    } catch (error) {
      if (error.code === 11000) {
        console.log('✓ emailLower unique index already exists');
      } else {
        console.error('✗ Error creating emailLower index:', error.message);
      }
    }

    // Ensure text search index
    console.log('\nEnsuring text search index...');
    try {
      await collection.createIndex(
        { name: 'text', email: 'text' },
        { 
          weights: { name: 3, email: 1 },
          name: 'text_search_index'
        }
      );
      console.log('✓ Text search index created/verified');
    } catch (error) {
      if (error.code === 85) {
        console.log('✓ Text search index already exists');
      } else {
        console.error('✗ Error creating text search index:', error.message);
      }
    }

    // Ensure compound index for age and createdAt
    console.log('\nEnsuring compound index (age, createdAt)...');
    try {
      await collection.createIndex({ age: 1, createdAt: -1 });
      console.log('✓ Compound index (age, createdAt) created/verified');
    } catch (error) {
      if (error.code === 85) {
        console.log('✓ Compound index (age, createdAt) already exists');
      } else {
        console.error('✗ Error creating compound index:', error.message);
      }
    }

    // Ensure isDeleted index
    console.log('\nEnsuring isDeleted index...');
    try {
      await collection.createIndex({ isDeleted: 1 });
      console.log('✓ isDeleted index created/verified');
    } catch (error) {
      if (error.code === 85) {
        console.log('✓ isDeleted index already exists');
      } else {
        console.error('✗ Error creating isDeleted index:', error.message);
      }
    }

    // Ensure createdAt index
    console.log('\nEnsuring createdAt index...');
    try {
      await collection.createIndex({ createdAt: 1 });
      console.log('✓ createdAt index created/verified');
    } catch (error) {
      if (error.code === 85) {
        console.log('✓ createdAt index already exists');
      } else {
        console.error('✗ Error creating createdAt index:', error.message);
      }
    }

    // Final index list
    console.log('\nFinal index list:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✓ All indexes verified/created successfully');
    
  } catch (error) {
    console.error('Error during index verification:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the script
if (require.main === module) {
  ensureIndexes()
    .then(() => {
      console.log('Index verification completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Index verification failed:', error);
      process.exit(1);
    });
}

export { ensureIndexes };
