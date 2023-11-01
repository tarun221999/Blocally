import { databaseConstants } from '../config/constants';
import ProductSchedulerSchema from './ProductSchedulerSchema';
import ProductMenuSchema from './ProductMenuSchema';

/**
 * Deals Schema for Realm
 */
const DealsSchema = {
    name: databaseConstants.DEALS_SCHEMA,
    properties: {
        dealId: 'int?',
        productId: 'int?',
        dealTitle: 'string?',
        dealDetails: 'string?',
        dealConditions: 'string?',
        dealMRP: 'float?',
        dealOP: 'float?',
        dealRedemptionStartDate: 'string?',
        dealRedemptionEndDate: 'string?',
        dealRedeemedCode: 'string?',
        dealRedeemedOn: 'string?',
        dealLat: 'string?',
        dealLng: 'string?',
        dealAddress: 'string?',
        dealAppointmentId: 'int?',
        appointmentDateTime: 'string?',
        appointmentStatusId: 'int?',
        dealImage: 'string?',
        dealStatusId: 'int?',
        dealAddedOn: 'string?',
        currentUTCDateTime: 'string?',
        businessId: 'int?',
        businessName: 'string?',
        businessAddress: 'string?',
        businessPhoneNumber: 'string?',
        dealNextAvailableStartDateTime: 'string?',
        dealNextAvailableEndDateTime: 'string?',
        dealCount: 'int?',
        hotDealLeft: 'int?',
        scheduleType: 'int?',
        productLat: 'string?',
        productLng: 'string?',
        productScheduler: {type: 'list', objectType:'PRODUCT_SCHEDULER'},
        productMenu: {type: 'list', objectType:'PRODUCT_MENU'},
        productIsHotDealUnlimited: 'bool?',
        imageLocalPath: 'string?',
        redeemedOn: 'string?',
        dealExpiredOn: 'string?',
        expiredOn: 'string?',
        productType: 'int?',
        isDiscounted: 'bool?',
        discount: 'float?',
    }
};

export default DealsSchema;