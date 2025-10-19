export const USER_FIELD_WHITELIST = {
  // Basic fields that are always safe to return
  basic: ['name', 'email', 'age', 'phone', 'address', 'createdAt', 'updatedAt'],
  
  // Admin fields include sensitive information
  admin: [
    'name', 'email', 'emailLower', 'age', 'phone', 'address', 
    'isDeleted', 'deletedAt', 'deletedBy', 'deleteReason',
    'createdAt', 'updatedAt'
  ],
  
  // Fields that should be hidden by default
  hidden: ['__v', 'isDeleted', 'deletedAt', 'deletedBy', 'deleteReason', 'emailLower']
};

export const FIELD_PRESETS = {
  basic: USER_FIELD_WHITELIST.basic,
  admin: USER_FIELD_WHITELIST.admin,
  custom: [] // Will be populated from query parameter
};

export function validateFields(fields: string[], preset?: string): string[] {
  if (preset && preset !== 'custom') {
    return FIELD_PRESETS[preset] || USER_FIELD_WHITELIST.basic;
  }
  
  // For custom fields, validate against whitelist
  const allAllowedFields = [...USER_FIELD_WHITELIST.basic, ...USER_FIELD_WHITELIST.admin];
  const invalidFields = fields.filter(field => !allAllowedFields.includes(field));
  
  if (invalidFields.length > 0) {
    throw new Error(`Invalid fields: ${invalidFields.join(', ')}. Allowed fields: ${allAllowedFields.join(', ')}`);
  }
  
  return fields;
}
