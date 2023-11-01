import { databaseConstants } from '../config/constants';

/**
 * Product's Scheduler Schema for Realm
 */
const ProductSchedulerSchema = {
    name: databaseConstants.PRODUCT_SCHEDULER_SCHEMA,
    properties: {
        scheduleDay: 'string?',
        startTime: 'string?',
        endTime: 'string?'
    }
};

export default ProductSchedulerSchema;