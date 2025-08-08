// frontend/static/js/modules/product.js
import { fetchData, showMessage } from '../main.js';
import { AuthModule } from './auth.js';

const ProductModule = (function() {
    async function getProducts() {
        try {
            return await fetchData('/api/products');
        } catch (error) {
            showMessage('error', error.message || 'Failed to fetch products.', 'product-list-message-container');
            throw error;
        }
    }

    async function createProduct(productData) {
        const token = AuthModule.getAuthData().accessToken;
        if (!token) {
            showMessage('error', 'You must be logged in to create a product.', 'create-product-section-message-container');
            return;
        }

        try {
            const data = await fetchData('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
            showMessage('success', 'Product created successfully!', 'create-product-section-message-container');
            return data;
        } catch (error) {
            showMessage('error', error.message || 'Failed to create product.', 'create-product-section-message-container');
            throw error;
        }
    }

    return {
        getProducts,
        createProduct
    };
})();

export { ProductModule };