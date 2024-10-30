async function AddToCartOnline(productData) {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    const userId = user.id;

    try {
        // Fetch the existing cart for the user
        const existingCart = await fetchCart(userId);
        const existingItemIndex = existingCart.findIndex(item => 
            item.product.id === productData.product.id &&
            item.variantId === productData.variantId &&
            item.size === productData.size );
        if (existingItemIndex > -1) {
            existingCart[existingItemIndex].quantity += 1;
            await updateCartItemQuantity(userId, existingCart[existingItemIndex].id, existingCart[existingItemIndex].quantity);
        } else {
            // Add new cart item
            const cartItem = {
                userId: userId,
                productId: Number(productData.product.id),
                quantity: 1,
                variantId: productData.variantId,
                size: productData.size
            };
            //console.log(cartItem);
            await addCartItem(userId, cartItem);
            updateCart();
            return true;
        }
    } catch (error) {
        console.error('Error adding to online cart:', error);
        return false;
    }
}

function AddToCart(productData) {
    if (!sessionStorage.getItem('loggedInUser')) {
        let cart = [];

        if (sessionStorage.getItem('localCart')) {
            try {
                cart = JSON.parse(sessionStorage.getItem('localCart')) || [];
            } catch (error) {
                cart = []; 
            }
        }
        
        try {
            const existingItemIndex = cart.findIndex(item => {
                return item.product.id === productData.product.id && item.variantId === productData.variantId;
            });

            if (existingItemIndex > -1) {
                cart[existingItemIndex].size = productData.size;
                cart[existingItemIndex].variantId = productData.variantId;
            } else {
                
                let cartItem = {
                    userId: null,
                    product: productData.product, 
                    quantity: 1,
                    variantId: productData.variantId,
                    size: productData.size
                };
                console.log("Item Added to Cart" + cartItem);
                cart.push(cartItem);
            }
            sessionStorage.setItem('localCart', JSON.stringify(cart));
            updateCart(); 
            return true; 
        } catch (error) {
            console.error('Error adding product to cart:', error);
            return false; 
        }
    } else {
        console.log("User is logged in, calling AddToCartOnline.");
        return AddToCartOnline(productData);
    }
}


async function DeleteFromCartOnline(productData) {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!user) {
        console.error('User is not logged in. Cannot delete from online cart.');
        return;
    }

    const userId = user.id;
    const productId = productData.product.id;
    const variantId = productData.variantId;
    try {
        const response = await fetch(`http://localhost:3000/cart/userId/${userId}/prodId/${productId}/variantId/${variantId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete item from online cart');
        }

        updateCart(); 
    } catch (error) {
        console.error('Error deleting item from online cart:', error);
    }
}

function DeleteFromCart(productData) {
    //console.log(product);
    const productId = productData.product && typeof productData.product === 'object' && productData.product.id ? productData.product.id : productData.product;
    //console.log(productId);
    if (!sessionStorage.getItem('loggedInUser')) {
        let cart = [];
        if (sessionStorage.getItem('localCart')) {
            try {
                cart = JSON.parse(sessionStorage.getItem('localCart')) || [];
            } catch (error) {
                console.error('Error parsing localCart:', error);
                cart = []; 
            }
        }
        const itemIndex = cart.findIndex(item => {
            return item.product.id === productId && item.variantId === productData.variantId; 
        });

        if (itemIndex > -1) {
            
            cart.splice(itemIndex, 1);
            console.log(`Removed item with productId: ${productId}`);
        } else {
            console.log(`Item with productId: ${productId} not found in cart.`);
        }
        sessionStorage.setItem('localCart', JSON.stringify(cart));
        updateCart(); 
    } else {
        
        DeleteFromCartOnline(productData); 
    }
}

function DeleteProductFromCart() {
    const productContainer = document.getElementById('cart-list');
    
    productContainer.addEventListener('click', function(event) {
        const button = event.target.closest('.delete-cart-item'); 
        if (button) {
            
            event.preventDefault(); 

            const productData = JSON.parse(button.getAttribute('data-product')); 
            
            DeleteFromCart(productData); 
        } else {
            console.log('Click was not on a button.'); 
        }
    });
}

async function updateCart() {
    const cart = document.getElementById("cart-list");
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    let cartItems = [];
    if (user) {
        const userId = user.id;
        try {
            const response = await fetch(`http://localhost:3000/cart/userId/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch online cart');
            }
            cartItems = await response.json(); 
        } catch (error) {
            console.error('Error fetching online cart:', error);
            cartItems = JSON.parse(sessionStorage.getItem('localCart')) || [];
        }
    } else {
        cartItems = JSON.parse(sessionStorage.getItem('localCart')) || [];
    }

    let cartHTML = '';
    if (cartItems.length > 0) {
        document.getElementById("cart-count").innerHTML = cartItems.length;
        cartItems.forEach(item => {
            const productObj = {
                product: item.product,
                variantId: item.variantId
            }; 
            //console.log(productObj);
            const productData = item.product;
            if (productData) {
                const totalPrice = item.quantity * productData.price; 
                let prodThumb = item.product.colors[(item.variantId - 1)].colorImages[0];
                //console.log(productData.price.toFixed(2));
                cartHTML += `
                    <div class="d-flex align-items-center gap-3">
                        <div class="bottom-product-img">
                            <a href="product-details.html">
                                <img src="${prodThumb}" width="60" alt="${productData.name}">
                            </a>
                        </div>
                        <div>
                            <h6 class="mb-0 fw-light mb-1">${productData.name}</h6>
                            <p class="mb-0"><strong>${item.quantity} X $${parseFloat(productData.price).toFixed(2)}</strong></p>
                            <p class="mb-0">Total: <strong>$${parseFloat(totalPrice).toFixed(2)}</strong></p>
                        </div>
                        <div class="ms-auto fs-5">
                            <a href="javascript:" class="delete-cart-item" data-product='${JSON.stringify(productObj)}' class="link-dark"><i class="bi bi-trash"></i></a>
                        </div>
                    </div>
                    <hr>`;
            } else {
                console.error('Product data is undefined for cart item:', item);
            }
        });

        cart.innerHTML = cartHTML;
        DeleteProductFromCart(); 
    } else {
        cart.innerHTML = '';
        document.getElementById("cart-count").innerHTML = 0;
    }
}

function checkLogin()
{
    document.getElementById('account-link').addEventListener('click', function(event) {
        event.preventDefault(); 
        const isLoggedIn = sessionStorage.getItem('loggedInUser') !== null;
        
        if(window.location.href != 'http://127.0.0.1:5500/login.html'){
            if (isLoggedIn) {
                window.location.href = this.href; 
            } else {
                
                alert('You need to log in to access this page.');
                window.location.href = 'login.html'; 
            }
        }
    });
}


async function updateCartCounter() {
    let cartItemsCount = 0;

    const loggedInUser = sessionStorage.getItem('loggedInUser');

    if (loggedInUser) {
        const userId = JSON.parse(loggedInUser).id;

        try {
            const response = await fetch(`http://localhost:3000/cart/userId/${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch online cart');
            }

            const onlineCart = await response.json();
            
            cartItemsCount = onlineCart.length;
            
        } catch (error) {
            console.error('Error fetching online cart:', error);
        }
    } else  {
        const cartItems = JSON.parse(sessionStorage.getItem('localCart')) || [];
        cartItemsCount = cartItems.length;
    }
    const cartIconCounter = document.getElementById('cart-count');
    if (cartIconCounter) {
        cartIconCounter.textContent = cartItemsCount > 0 ? cartItemsCount : '0'; 
    }
}

