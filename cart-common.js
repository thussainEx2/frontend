async function fetchCart(userId) {
    const response = await fetch(`http://localhost:3000/cart/userId/${userId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch online cart');
    }

    return await response.json();
}

async function updateCartItemQuantity(userId, itemId, quantity) {
    const response = await fetch(`http://localhost:3000/cart/userId/${userId}/itemId/${itemId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity })
    });

    if (!response.ok) {
        throw new Error('Failed to update online cart item quantity');
    }
}

async function addCartItem(userId, cartItem) {
    const response = await fetch(`http://localhost:3000/cart/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: userId,
            productId: cartItem.productId,
            quantity: cartItem.quantity,
            variantId: cartItem.variantId,
            size: cartItem.size
        })
    });

    if (!response.ok) {
        throw new Error('Failed to add item to online cart');
    }
}

async function transferLocalCartToOnlineCart() {
    const user = JSON.parse(sessionStorage.getItem('loggedInUser'));
    
    if (!user) {
        console.error('User is not logged in. Cannot transfer local cart.');
        return;
    }

    const userId = user.id;

    const localCartData = sessionStorage.getItem('localCart');
    if (!localCartData) {
        console.log('No local cart items to transfer.');
        return;
    }

    let localCart;
    try {
        localCart = JSON.parse(localCartData);
    } catch (error) {
        console.error('Error parsing local cart:', error);
        return;
    }

    for (const item of localCart) {
        const cartItem = {
            productId: item.product.id,
            quantity: item.quantity,
            variantId: item.variantId,
            size: item.size
        };

        try {
            const existingCart = await fetchCart(userId);
            const existingItemIndex = existingCart.findIndex(existingItem => existingItem.productId === cartItem.productId && existingItem.variantId === cartItem.variantId);

            if (existingItemIndex > -1) {
                existingCart[existingItemIndex].quantity += cartItem.quantity;
                await updateCartItemQuantity(userId, existingCart[existingItemIndex].id, existingCart[existingItemIndex].quantity);
            } else {
                await addCartItem(userId, cartItem);
            }
        } catch (error) {
            console.error('Error transferring item to online cart:', error);
        }
    }

    sessionStorage.removeItem('localCart');
    console.log('Local cart transferred to online cart successfully.');
}
