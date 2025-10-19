import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { CursorQueryDto } from './dto/cursor-query.dto';
import { BulkUpsertDto } from './dto/bulk-upsert.dto';
import { SoftDeleteDto } from './dto/soft-delete.dto';
import { paginate, paginateCursor } from '../common/utils/paginate.util';
import { validateFields } from '../constants/field-whitelist';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Manually set emailLower
      const userData = {
        ...createUserDto,
        emailLower: createUserDto.email.toLowerCase()
      };
      
      const user = new this.userModel(userData);
      const savedUser = await user.save();
      return savedUser;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findAll(queryDto: QueryUsersDto) {
    const {
      page = 1,
      pageSize = 10,
      sort = 'createdAt:-1',
      fields = 'basic',
      customFields,
      includeDeleted = false,
      ...filters
    } = queryDto;

    // Build filter object
    const filter = this.buildFilter(filters, includeDeleted);

    // Build projection
    const projection = this.buildProjection(fields, customFields);

    // Parse sort
    const sortObj = this.parseSort(sort);

    return paginate(this.userModel, filter, projection, {
      page,
      pageSize,
      sort: sortObj
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        id,
        updateUserDto,
        { new: true, runValidators: true }
      ).exec();
      
      if (!user) {
        throw new NotFoundException('User not found');
      }
      
      return user;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async remove(id: string, softDeleteDto: SoftDeleteDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: softDeleteDto.deletedBy ? new Types.ObjectId(softDeleteDto.deletedBy) : null,
        deleteReason: softDeleteDto.deleteReason
      },
      { new: true }
    ).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async restore(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deleteReason: null
      },
      { new: true }
    ).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async cursorPaginate(queryDto: CursorQueryDto) {
    const { limit = 20, after } = queryDto;
    
    const filter = { isDeleted: false };
    const projection = { __v: 0, isDeleted: 0, deletedAt: 0, deletedBy: 0, deleteReason: 0, emailLower: 0 };

    return paginateCursor(this.userModel, filter, projection, { limit, after });
  }

  async search(query: string) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    const filter = {
      $text: { $search: query },
      isDeleted: false
    };

    const projection = {
      score: { $meta: 'textScore' },
      __v: 0,
      isDeleted: 0,
      deletedAt: 0,
      deletedBy: 0,
      deleteReason: 0,
      emailLower: 0
    };

    const users = await this.userModel
      .find(filter, projection)
      .sort({ score: { $meta: 'textScore' } })
      .exec();

    return users;
  }

  async bulkUpsert(bulkUpsertDto: BulkUpsertDto) {
    const { users } = bulkUpsertDto;
    
    // Normalize emails and remove duplicates
    const normalizedUsers = users.map(user => ({
      ...user,
      emailLower: user.email.toLowerCase()
    }));

    // Remove duplicates based on emailLower
    const uniqueUsers = normalizedUsers.filter((user, index, self) =>
      index === self.findIndex(u => u.emailLower === user.emailLower)
    );

    const operations = uniqueUsers.map(user => ({
      updateOne: {
        filter: { emailLower: user.emailLower },
        update: {
          $set: {
            name: user.name,
            email: user.email,
            age: user.age,
            phone: user.phone,
            address: user.address,
            updatedAt: new Date()
          },
          $setOnInsert: {
            emailLower: user.emailLower,
            createdAt: new Date(),
            isDeleted: false
          }
        },
        upsert: true
      }
    }));

    const result = await this.userModel.bulkWrite(operations);
    
    return {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
      errors: []
    };
  }

  async getStats() {
    const pipeline: any[] = [
      { $match: { isDeleted: false } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                avgAge: { $avg: '$age' },
                minAge: { $min: '$age' },
                maxAge: { $max: '$age' }
              }
            }
          ],
          byAgeRange: [
            {
              $bucket: {
                groupBy: '$age',
                boundaries: [0, 18, 25, 35, 50, 120],
                default: 'Others',
                output: {
                  count: { $sum: 1 }
                }
              }
            }
          ],
          byCreatedMonth: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m',
                    date: '$createdAt'
                  }
                },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ];

    const result = await this.userModel.aggregate(pipeline).exec();
    return result[0];
  }

  private buildFilter(filters: any, includeDeleted: boolean) {
    const filter: any = {};

    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    // Basic filters
    if (filters.email) filter.email = { $regex: filters.email, $options: 'i' };
    
    // Name filters - prioritize nameRegex over basic name filter
    if (filters.nameRegex) {
      filter.name = { $regex: filters.nameRegex, $options: 'i' };
    } else if (filters.name) {
      filter.name = { $regex: filters.name, $options: 'i' };
    }
    
    // Age filters - prioritize advanced operators over basic age filter
    if (filters.ageIn) {
      const ages = filters.ageIn.split(',').map(age => parseInt(age.trim()));
      filter.age = { $in: ages };
    } else if (filters.ageNin) {
      const ages = filters.ageNin.split(',').map(age => parseInt(age.trim()));
      filter.age = { $nin: ages };
    } else if (filters.age) {
      filter.age = filters.age;
    }
    
    // Phone filters - prioritize hasPhone over basic phone filter
    if (filters.hasPhone !== undefined) {
      if (filters.hasPhone) {
        filter.phone = { $exists: true, $nin: [null, ''] };
      } else {
        filter.$or = [
          { phone: { $exists: false } },
          { phone: null },
          { phone: '' }
        ];
      }
    } else if (filters.phone) {
      filter.phone = { $regex: filters.phone, $options: 'i' };
    }

    return filter;
  }

  private buildProjection(fields: string, customFields?: string) {
    const projection: any = {};

    if (fields === 'custom' && customFields) {
      const fieldList = customFields.split(',').map(f => f.trim());
      const validatedFields = validateFields(fieldList, 'custom');
      
      // Hide sensitive fields by default
      const hiddenFields = ['__v', 'isDeleted', 'deletedAt', 'deletedBy', 'deleteReason', 'emailLower'];
      hiddenFields.forEach(field => {
        projection[field] = 0;
      });

      // Include only requested fields
      validatedFields.forEach(field => {
        projection[field] = 1;
      });
    } else if (fields === 'admin') {
      // Admin can see all fields except __v
      projection.__v = 0;
    } else {
      // Basic fields - hide sensitive data
      const hiddenFields = ['__v', 'isDeleted', 'deletedAt', 'deletedBy', 'deleteReason', 'emailLower'];
      hiddenFields.forEach(field => {
        projection[field] = 0;
      });
    }

    return projection;
  }

  private parseSort(sort: string) {
    const sortObj: any = {};
    const sortFields = sort.split(',');
    
    sortFields.forEach(field => {
      const [key, direction] = field.split(':');
      sortObj[key] = direction === '1' ? 1 : -1;
    });

    return sortObj;
  }
}
