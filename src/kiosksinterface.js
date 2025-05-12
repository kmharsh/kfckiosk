import { useState } from 'react';
import './App.css';

const KiosksInterface = ({ response, commandText }) => {
    const [quantity, setQuantity] = useState({});
    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const itemdata = response;

    const handleQuantityChange = (index, type) => {
        setQuantity(prevQuantity => {
            const updatedQuantity = { ...prevQuantity };
            if (type === 'increment') {
                updatedQuantity[index] = (updatedQuantity[index] || 0) + 1;
            } else if (type === 'decrement' && updatedQuantity[index] > 0) {
                updatedQuantity[index] -= 1;
            }

            setCart(prevCart =>
                prevCart.map(item =>
                    item.id === itemdata[index].id
                        ? { ...item, quantity: updatedQuantity[index] }
                        : item
                )
            );

            return updatedQuantity;
        });
    };

    const handleAddToCart = (index) => {
        setQuantity(prevQuantity => {
            const updatedQuantity = { ...prevQuantity };
            updatedQuantity[index] = 1;
            return updatedQuantity;
        });

        const itemToAdd = itemdata[index];
        console.log(itemToAdd, "itemToAdd");

        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(
                (item) => item.option_title === itemToAdd.option_title
            );

            if (existingItemIndex !== -1) {
                const updatedCart = [...prevCart];
                updatedCart[existingItemIndex].quantity = 1;
                return updatedCart;
            } else {
                return [...prevCart, { ...itemToAdd, quantity: 1 }];
            }
        });
    };

    const calculateTotal = () => {
        let totalCount = 0;
        let totalPrice = 0;
        cart.forEach(item => {
            const qty = item.quantity || 1;
            const price = item.originalPrice || 0;
            totalCount += qty;
            totalPrice += price * qty;
        });
        return { totalCount, totalPrice };
    };

    const handleViewCart = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handlePlaceOrder = async () => {
        const orderPayload = cart.map(item => ({
            id: item.id,
            name: item.option_title,
            quantity: item.quantity,
            price: item.originalPrice,
            sku: item.sku,
        }));
    
        // ✅ Show payload in console before sending to API
        console.log('Sending to API:', JSON.stringify({ items: orderPayload }, null, 2));
    
        // Group items by category_id
        const categories = orderPayload.reduce((acc, item) => {
            if (!acc[item.sku]) {
                acc[item.sku] = [];
            }
            acc[item.sku].push(item);
            return acc;
        }, {});
    
        // Get category names or category_id to display in the message
        const categoryMessages = Object.keys(categories).map(sku => {
            const categoryItems = categories[sku];
            const categoryName = `Category ${sku}`; // You can replace this with actual category names if you have a mapping
            return `${categoryName}: ${categoryItems.length} item(s)`;
        }).join(', ');
    
        // Show success message based on categories
        alert(`Order placed successfully for ${categoryMessages}!`);
    
        // Clear cart
        setCart([]);
        setQuantity({});
        setIsModalOpen(false);
    
        // Uncomment this block to handle actual API call
        /*
        try {
            const response = await fetch('https://your-api-url.com/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items: orderPayload }),
            });
    
            const data = await response.json();
            console.log('Order placed successfully:', data);
    
            // Clear cart and reset states
            setCart([]);
            setQuantity({});
            setIsModalOpen(false);
            alert(`Order placed successfully for ${categoryMessages}!`);
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order');
        }
        */
    };
    


    if (Array.isArray(response)) {
        const { totalCount, totalPrice } = calculateTotal();

        return (
            <div className="burger-container">
                {itemdata?.map((item, index) => (
                    <div className="burger-card" key={index}>
                        <img
                            className="cart-image"
                            src={item?.image || 'default-image.jpg'}
                            alt={item?.option_title || 'Item'}
                        />
                        <div className='bottomcart-wrp'>
                            <div className='burger-btnwrp'>
                                <div className="burger-name">{item?.option_title || 'Item Name'}</div>
                                <div className="burger-price"><span>&#8377;</span>{item?.originalPrice}</div>
                            </div>
                            {quantity[index] === undefined || quantity[index] === 0 ? (
                                <button onClick={() => handleAddToCart(index)} className="simplebtn">
                                    Add to Order
                                </button>
                            ) : (
                                <div className="quantity-buttons">
                                    <button onClick={() => handleQuantityChange(index, 'increment')} className="quantity-btn">+</button>
                                    <span className="quantity-display">{quantity[index]}</span>
                                    <button
                                        onClick={() => handleQuantityChange(index, 'decrement')}
                                        className="quantity-btn"
                                        disabled={quantity[index] === 0}
                                    >
                                        -
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {totalCount > 0 && (
                    <div className="cart-summary">
                        <button onClick={handleViewCart} className="cart-total-btn">
                            View Cart ({totalCount} Items - &#8377; {totalPrice.toFixed(2)})
                        </button>
                    </div>
                )}

                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button className="modal-close-btn" onClick={handleCloseModal}>X</button>
                            <h3>Your Cart</h3>
                            <ul>
                                {cart.map((item, index) => (
                                    <li key={index}>
                                        {item.name_en || item.option_title || 'Item Name'} — Qty: {item.quantity || 1} — &#8377; {(item.originalPrice * item.quantity).toFixed(2)}
                                    </li>
                                ))}
                            </ul>
                            <div className="modal-total">
                                <p>Total Items: {totalCount}</p>
                                <p>Total Price: &#8377; {totalPrice.toFixed(2)}</p>
                            </div>
                            <button className="place-order-btn" onClick={handlePlaceOrder}>Place Order</button>
                        </div>
                        <div className="modal-overlay-bg" onClick={handleCloseModal}></div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default KiosksInterface;
