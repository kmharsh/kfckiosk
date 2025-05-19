
import { useState } from 'react';
import { postFetchData } from "../utils/api";
import { URLS } from "../utils/endpoints";
import '../App.css';

const KiosksInterface = ({ response }) => {
    console.log(response.items, "response1");  // Log the response data for debugging

    const [quantity, setQuantity] = useState({});
    const [cart, setCart] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Ensure that itemdata is available
    const itemdata = response.items;
    console.log(itemdata, "itemdata");  // Log the itemdata for debugging

    // Handle quantity changes (increment/decrement)
    const handleQuantityChange = (index, type) => {
        setQuantity(prev => {
            const updated = { ...prev };
            if (type === 'increment') {
                updated[index] = (updated[index] || 0) + 1;
            } else if (type === 'decrement' && updated[index] > 0) {
                updated[index] -= 1;
            }

            // Update cart quantity for the item
            setCart(prevCart =>
                prevCart.map(item =>
                    item.id === itemdata[index].id
                        ? { ...item, quantity: updated[index] }
                        : item
                )
            );
            return updated;
        });
    };

    // Handle adding items to the cart
    const handleAddToCart = (index) => {
        setQuantity(prev => ({ ...prev, [index]: 1 }));

        const itemToAdd = itemdata[index];
        setCart(prevCart => {
            const existingIndex = prevCart.findIndex(
                (item) => item.option_title === itemToAdd.option_title
            );

            // Update cart if the item already exists
            if (existingIndex !== -1) {
                const updated = [...prevCart];
                updated[existingIndex].quantity = 1;
                return updated;
            } else {
                return [...prevCart, { ...itemToAdd, quantity: 1 }];
            }
        });
    };

    // Calculate total items and price
    const calculateTotal = () => {
        let totalCount = 0, totalPrice = 0;
        cart.forEach(item => {
            const qty = item.quantity || 1;
            const price = item.originalPrice || 0;
            totalCount += qty;
            totalPrice += price * qty;
        });
        return { totalCount, totalPrice };
    };

    // Handle order placement
    const handlePlaceOrder = async () => {
        const orderPayload = cart.map(item => ({
            id: item.id,
            name: item.option_title,
            quantity: item.quantity,
            price: item.originalPrice,
            sku: item.sku,
        }));

        try {
            const result = await postFetchData(URLS.PLACE_ORDER, { items: orderPayload });

            // Group items by SKU and show summary
            const groupedBySku = orderPayload.reduce((acc, item) => {
                if (!acc[item.sku]) acc[item.sku] = [];
                acc[item.sku].push(item);
                return acc;
            }, {});

            const summary = Object.keys(groupedBySku).map(sku =>
                `Category ${sku}: ${groupedBySku[sku].length} item(s)`
            ).join(', ');

            alert(`Order placed successfully for ${summary}!`);

            setCart([]);  // Clear the cart
            setQuantity({});  // Reset quantities
            setIsModalOpen(false);  // Close the modal
        } catch (error) {
            console.error('Order error:', error);
            alert('Failed to place order.');
        }
    };

    // Calculate total items and total price
    const { totalCount, totalPrice } = calculateTotal();

    return (
        <div className="burger-container">
            {itemdata?.length > 0 ? (
                itemdata.map((item, index) => (
                    <div className="burger-card" key={index}>
                        <img className="cart-image" src={item?.image || 'default.jpg'} alt={item?.option_title || 'Item'} />
                        <div className='bottomcart-wrp'>
                            <div className='burger-btnwrp'>
                                <div className="burger-name">{item?.name || 'Item'}</div>
                                <div className="burger-price">AED {item?.price}</div>
                            </div>
                            {quantity[index] === undefined || quantity[index] === 0 ? (
                                <button onClick={() => handleAddToCart(index)} className="simplebtn">Add to Order</button>
                            ) : (
                                <div className="quantity-buttons">
                                    <button onClick={() => handleQuantityChange(index, 'increment')} className="quantity-btn">+</button>
                                    <span className="quantity-display">{quantity[index]}</span>
                                    <button
                                        onClick={() => handleQuantityChange(index, 'decrement')}
                                        className="quantity-btn"
                                        disabled={quantity[index] === 0}
                                    >-</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p>No items available</p>  // Fallback message if no items are in `itemdata`
            )}

            {totalCount > 0 && (
                <div className="cart-summary">
                    <button onClick={() => setIsModalOpen(true)} className="cart-total-btn">
                        View Cart ({totalCount} Items - ₹{totalPrice.toFixed(2)})
                    </button>
                </div>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>X</button>
                        <h3>Your Cart</h3>
                        <ul>
                            {cart.map((item, index) => (
                                <li key={index}>
                                    {item.option_title} — Qty: {item.quantity} — ₹{(item.originalPrice * item.quantity).toFixed(2)}
                                </li>
                            ))}
                        </ul>
                        <div className="modal-total">
                            <p>Total Items: {totalCount}</p>
                            <p>Total Price: ₹{totalPrice.toFixed(2)}</p>
                        </div>
                        <button className="place-order-btn" onClick={handlePlaceOrder}>Place Order</button>
                    </div>
                    <div className="modal-overlay-bg" onClick={() => setIsModalOpen(false)}></div>
                </div>
            )}
        </div>
    );
};

export default KiosksInterface;
