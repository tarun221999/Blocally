import { databaseConstants } from '../config/constants';

/**
 * Product's Menu Schema for Realm
 */
const ProductMenuSchema = {
    name: databaseConstants.PRODUCT_MENU_SCHEMA,
    properties: {
        productMenuId: 'int?',
        menuTitle: 'string?',
        menuImage: 'string?'
    }
};

export default ProductMenuSchema;