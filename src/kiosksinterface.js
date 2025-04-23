

import { useState, useEffect } from 'react';
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
            return updatedQuantity;
        });
    };

    const handleAddToCart = (index) => {
        setQuantity(prevQuantity => {
            const updatedQuantity = { ...prevQuantity };
            updatedQuantity[index] = 1;
            return updatedQuantity;
        });
        setCart(prevCart => [...prevCart, itemdata[index]]);
    };

    // ✅ Listen for voice commands
    useEffect(() => {
        if (!commandText) return;

        if (commandText === 'order') {
            if (itemdata.length > 0) {
                handleAddToCart(0);
                console.log('🛒 Added first item via voice command');
            }
        } else if (commandText === 'clear') {
            setQuantity({});
            setCart([]);
        } else if (commandText === 'reset') {
            setQuantity({});
            setCart([]);
            setIsModalOpen(false);
        }
    }, [commandText]);

    const calculateTotal = () => {
        let totalCount = 0;
        let totalPrice = 0;
        cart.forEach(item => {
            totalCount += 1;
            totalPrice += 24.95;
        });
        return { totalCount, totalPrice };
    };

    const handleViewCart = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
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
                                    <li key={index}>{item.name_en || 'Item Name'}</li>
                                ))}
                            </ul>
                            <div className="modal-total">
                                <p>Total Items: {totalCount}</p>
                                <p>Total Price: &#8377; {totalPrice.toFixed(2)}</p>
                            </div>
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
