import { databaseConstants } from '../config/Constants';

/**
 * Deals Schema for Realm
 */
const DealsSchema = {
    name: databaseConstants.DEALS_SCHEMA,
    properties: {
        redeemedCode: 'string?',
        redeemedOn: 'string?',
        redeemedOnISO: 'string?',
    }
};

export default DealsSchema;