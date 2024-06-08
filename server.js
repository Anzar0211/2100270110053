const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const NodeCache = require('node-cache');


const app = express();
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE3ODI0NzY2LCJpYXQiOjE3MTc4MjQ0NjYsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjM5ZjlhOWFlLTNkZTktNDM1NS1iMTUzLWFjYTMzZGIwNjc4OSIsInN1YiI6Im1vaGFtbWFkYW56YXIyMTExMDMyQGFrZ2VjLmFjLmluIn0sImNvbXBhbnlOYW1lIjoiQWpheSBLdW1hciBHYXJnIEVuZ2luZWVyaW5nIENvbGxlZ2UiLCJjbGllbnRJRCI6IjM5ZjlhOWFlLTNkZTktNDM1NS1iMTUzLWFjYTMzZGIwNjc4OSIsImNsaWVudFNlY3JldCI6InhJdGhmcHJMaVZPTWF2anMiLCJvd25lck5hbWUiOiJNb2hhbW1hZCBBbnphciIsIm93bmVyRW1haWwiOiJtb2hhbW1hZGFuemFyMjExMTAzMkBha2dlYy5hYy5pbiIsInJvbGxObyI6IjIxMDAyNzAxMTAwNTMifQ.vIY8jhRkTo937nF3ff3jv_99TIkj30IPiJkMxkM2gsg';
const COMPANIES = ['AMZ', 'FLP', 'SNP', 'MYN', 'AZO'];
const TEST_SERVER_URL = 'http://20.244.56.144/test';


async function registerWithCompanies() {
    try {
        const response = await axios.post(`${TEST_SERVER_URL}/auth`,{
            headers: { 'Authorization': AUTH_TOKEN }
        });
        console.log('Registered with companies:', response.data);
    } catch (error) {
        console.error('Error registering with companies:', error.message);
    }
}

async function fetchProducts(company, category, top, minPrice, maxPrice) {
    const url = `${TEST_SERVER_URL}/companies/${company}/categories/${category}/products`;
    const params = { top, minPrice, maxPrice };
    try {
        const response = await axios.get(url, { params });
        return response.data.products.map(product => ({
        productName: product.productName,
        price: product.price,
        rating: product.rating,
        discount: product.discount,
        availability: product.availability,
        id: uuidv4(),
        company
        }));
    } catch (error) {
        console.error(`Error fetching products from ${company}:`, error.message);
        return [];
    }
}

app.get('/categories/:categoryname/products', async (req, res) => {
    const { categoryname } = req.params;
    const { n = 10, page = 1, minPrice, maxPrice, sortBy, order = 'asc' } = req.query;
    const cacheKey = `${categoryname}-${n}-${page}-${minPrice}-${maxPrice}-${sortBy}-${order}`;
    
    if (cache.has(cacheKey)) {
        return res.json(cache.get(cacheKey));
    }
    const top = Math.min(n, 10); 
    const start = (page - 1) * top;
    try {
        const productPromises = COMPANIES.map(company => fetchProducts(company, categoryname, top, minPrice, maxPrice));
        let products = (await Promise.all(productPromises)).flat();
        
        if (sortBy) {
        products.sort((a, b) => {
            if (a[sortBy] < b[sortBy]) return order === 'asc' ? -1 : 1;
            if (a[sortBy] > b[sortBy]) return order === 'asc' ? 1 : -1;
            return 0;
        });
        }
        
        const paginatedProducts = products.slice(start, start + top);
        
        cache.set(cacheKey, paginatedProducts);
        
        res.json(paginatedProducts);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/categories/:categoryname/products/:productid', (req, res) => {
    const { productid } = req.params;
    
    const products = cache.keys().flatMap(key => cache.get(key));
    const product = products.find(p => p.id === productid);
    
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});


app.listen(3500, async () => {
    await registerWithCompanies();
    console.log(`Server running on port 3500`);
});